import Router from "express";
import { upload } from "../../core/middleware/multer.js";
import { validate } from "../../core/middleware/validate.js";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../../shared/validators/auth.validator.js";
import { registerUser, loginUser, logoutUser, getAccessToken, forgotPasswordMail, resetPassword } from "./auth.controller.js";
import { isLoggedIn } from "../../core/middleware/isLoggedIn.js";

const authRouter = Router();

authRouter.post("/register", upload.single("profileImage"), validate(registerSchema), registerUser);
authRouter.post("/login", validate(loginSchema), loginUser);
authRouter.post("/logout", isLoggedIn, logoutUser);
authRouter.post("/refresh-token", getAccessToken);
authRouter.post("/forgot-password", validate(forgotPasswordSchema), forgotPasswordMail);
authRouter.post("/reset-password/:token", validate(resetPasswordSchema), resetPassword);

export default authRouter;
