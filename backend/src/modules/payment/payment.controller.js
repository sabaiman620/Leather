import { asyncHandler } from "../../core/utils/async-handler.js";
import Payment from "../../models/Payment.model.js";
import Order from "../../models/Order.model.js";
import { ApiError } from "../../core/utils/api-error.js";
import { ApiResponse } from "../../core/utils/api-response.js";
import { createPayFastPayment, handlePayFastWebhook } from "./services/payfast.service.js";
import { createJazzCashPayment, handleJazzCashWebhook } from "./services/jazzcash.service.js";
import { createEasyPaisaPayment, handleEasyPaisaWebhook } from "./services/easypaisa.service.js";

//-------------------- CREATE PAYMENT --------------------//
const createPayment = asyncHandler(async (req, res) => {
    const { orderId, method, amount, mobileNumber } = req.body;

    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, "Order not found");
    // Ensure amount matches (considering float precision)
    if (Math.abs(order.totalAmount - amount) > 0.01) throw new ApiError(400, "Amount mismatch");

    // Check if there is already a successful payment? 
    // Usually we allow retries if previous failed.

    const payment = await Payment.create({
        order: orderId,
        method,
        amount,
        status: "pending"
    });

    let paymentResponse;

    try {
        switch (method) {
            case "cod":
                order.paymentStatus = "pending";
                await order.save();
                paymentResponse = { type: 'cod', message: 'Order placed with Cash on Delivery' };
                break;
            case "payfast":
                paymentResponse = await createPayFastPayment(order, amount);
                break;
            case "jazzcash":
                paymentResponse = await createJazzCashPayment(order, amount);
                break;
            case "easypaisa":
                if (!mobileNumber) throw new ApiError(400, "Mobile number required for EasyPaisa");
                paymentResponse = await createEasyPaisaPayment(order, amount, mobileNumber);
                break;
            default:
                throw new ApiError(400, "Invalid payment method");
        }
    } catch (error) {
        // If initiation fails, we should probably mark payment as failed
        payment.status = "failed";
        await payment.save();
        throw error;
    }

    return res.status(201).json(new ApiResponse(201, { payment, ...paymentResponse }, "Payment initiated successfully"));
});

//-------------------- GATEWAY WEBHOOK MAIN --------------------//
const gatewayWebhook = asyncHandler(async (req, res) => {
    const { provider } = req.params;
    let result;

    console.log(`Received Webhook for ${provider}`, req.body);

    try {
        if (provider === 'payfast') {
            result = await handlePayFastWebhook(req);
        } else if (provider === 'jazzcash') {
            result = await handleJazzCashWebhook(req);
        } else if (provider === 'easypaisa') {
            result = await handleEasyPaisaWebhook(req);
        } else {
            throw new ApiError(400, "Unknown provider");
        }
    } catch (error) {
        console.error(`Webhook Error [${provider}]`, error);
        return res.status(400).send("Webhook Error");
    }

    const { status, transactionId, orderId, message } = result;

    if (!orderId) {
        console.error("Webhook missing orderId", result);
        return res.status(400).send("Missing Order ID");
    }

    // Find latest pending payment for this order
    // We look for the specific payment attempt or just the latest one
    const payment = await Payment.findOne({ order: orderId, method: provider }).sort({ createdAt: -1 });
    
    if (!payment) {
        console.error(`Payment record not found for Order: ${orderId} Provider: ${provider}`);
        return res.status(404).send("Payment record not found");
    }

    // Prevent overwriting if already paid
    if (payment.status === 'success') {
        return res.status(200).send('Already Processed');
    }

    payment.status = status;
    payment.transactionId = transactionId || payment.transactionId;
    await payment.save();

    const order = await Order.findById(orderId);
    if (order) {
        if (status === "success") {
            order.paymentStatus = "paid";
            // Check if we need to update orderStatus too?
            // usually kept as pending/processing until admin confirms or auto-processing logic
        } else if (status === "failed") {
            order.paymentStatus = "failed";
        }
        await order.save();
    }

    if (status === 'failed' && message) {
        console.warn(`Payment Failed: ${message}`);
    }

    // Providers usually expect a 200 OK
    return res.status(200).send('OK');
});

//-------------------- GET PAYMENT --------------------//
const getPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const payment = await Payment.findById(id).populate("order");
    if (!payment) {
        throw new ApiError(404, "Payment not found");
    }

    // Access control
    if (req.user.role !== 'admin') {
        // If order has a buyer, check if it matches
        if (payment.order && payment.order.buyer && payment.order.buyer.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "You are not authorized to view this payment");
        }
    }

    return res.status(200).json(new ApiResponse(200, payment, "Payment details retrieved successfully"));
});

//-------------------- UPDATE PAYMENT STATUS (ADMIN) --------------------//
const updatePaymentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
        throw new ApiError(404, "Payment not found");
    }

    payment.status = status;
    await payment.save();

    // Sync with Order
    const order = await Order.findById(payment.order);
    if (order) {
        if (status === "success") order.paymentStatus = "paid";
        else if (status === "failed") order.paymentStatus = "failed";
        else if (status === "pending") order.paymentStatus = "pending";
        await order.save();
    }

    return res.status(200).json(new ApiResponse(200, payment, "Payment status updated successfully"));
});

export { createPayment, updatePaymentStatus, getPayment, gatewayWebhook };
