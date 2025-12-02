import Router from "express";
import { isLoggedIn } from "../../core/middleware/isLoggedIn.js";
import { isAdmin } from "../../core/middleware/isAdmin.js";
import { validate } from "../../core/middleware/validate.js";
import { createPaymentSchema, updatePaymentStatusSchema } from "../../shared/validators/payment.validator.js";
import { createPayment, updatePaymentStatus, getPayment } from "./payment.controller.js";

const paymentRouter = Router();

//-------------------- USER ROUTES --------------------//
paymentRouter.post("/", isLoggedIn, validate(createPaymentSchema), createPayment);
paymentRouter.get("/:id", isLoggedIn, getPayment);

//-------------------- ADMIN ROUTES --------------------//
paymentRouter.put("/:id/status", isLoggedIn, isAdmin, validate(updatePaymentStatusSchema), updatePaymentStatus);

export default paymentRouter;
