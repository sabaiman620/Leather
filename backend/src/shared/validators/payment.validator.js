import { z } from "zod";

const createPaymentSchema = z.object({
    orderId: z.string().min(1, "Order ID is required"),
    method: z.enum(["cash", "card", "bank-transfer", "e-wallet"]),
    amount: z.number().min(0, "Amount must be greater than 0")
});

const updatePaymentStatusSchema = z.object({
    status: z.enum(["pending", "completed", "failed"]),
    transactionId: z.string().optional()
});

export { createPaymentSchema, updatePaymentStatusSchema };
