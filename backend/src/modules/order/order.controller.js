//login user can change phone number or address.New details saved inside shippingDetails It does NOT update the user’s 
//guest user:Saved in guestDetails + copied to shippingDetails
import { asyncHandler } from "../../core/utils/async-handler.js";
import Order from "../../models/Order.model.js";
import { ApiError } from "../../core/utils/api-error.js";
import { ApiResponse } from "../../core/utils/api-response.js";

//-------------------- CREATE ORDER --------------------//
const createOrder = asyncHandler(async (req, res) => {
    const { items, totalAmount, guestDetails } = req.body;

    if (!items || items.length === 0) {
        throw new ApiError(400, "Order items are required");
    }

    let orderData = {
        items,
        totalAmount
    };

    // ---------------- BUYER CHECKOUT ----------------
    if (req.user) {
        orderData.buyer = req.user._id;

        // If buyer provides new checkout details → use them
        if (guestDetails) {
            orderData.shippingDetails = guestDetails;
        } else {
            // Otherwise auto-fill from profile
            orderData.shippingDetails = {
                fullName: req.user.userName,
                email: req.user.userEmail,
                phone: req.user.phoneNumber,
                address: req.user.userAddress
            };
        }
    } 

    // ---------------- GUEST CHECKOUT ----------------
    else {
        if (!guestDetails) {
            throw new ApiError(400, "Guest details are required for guest checkout");
        }

        orderData.guestDetails = guestDetails;
        orderData.shippingDetails = guestDetails;
    }

    const newOrder = await Order.create(orderData);

    return res
        .status(201)
        .json(new ApiResponse(201, newOrder, "Order placed successfully"));
});

//-------------------- GET BUYER ORDERS --------------------//
const getUserOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ buyer: req.user._id });
    return res.status(200).json(new ApiResponse(200, orders, "Orders fetched successfully"));
});

//-------------------- GET SINGLE ORDER --------------------//
const getOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) throw new ApiError(404, "Order not found");

    return res.status(200).json(new ApiResponse(200, order, "Order fetched successfully"));
});

//-------------------- ADMIN: GET ALL ORDERS --------------------//
const getAllOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find().populate("buyer", "userName userEmail");
    return res.status(200).json(new ApiResponse(200, orders, "All orders fetched successfully"));
});

//-------------------- UPDATE ORDER STATUS --------------------//
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) throw new ApiError(404, "Order not found");

    order.orderStatus = status;
    await order.save();

    return res.status(200).json(new ApiResponse(200, order, "Order status updated"));
});

export { createOrder, getUserOrders, getOrder, getAllOrders, updateOrderStatus };
