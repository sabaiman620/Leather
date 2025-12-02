import { asyncHandler } from "../../core/utils/async-handler.js";
import crypto from "crypto";
import User from "../../models/User.model.js";
import { ApiError } from "../../core/utils/api-error.js";
import { ApiResponse } from "../../core/utils/api-response.js";
import { 
    userForgotPasswordMailBody, 
    userVerificationMailBody 
} from "../../shared/constants/mail.constant.js";
import { mailTransporter } from "../../shared/helpers/mail.helper.js";
import { storeLoginCookies, storeAccessToken } from "../../shared/helpers/cookies.helper.js";
import S3UploadHelper from "../../shared/helpers/s3Upload.js";

//-------------------- REGISTER USER --------------------//
const registerUser = asyncHandler(async (req, res) => {
    const { userName, userEmail, userPassword, userRole, phoneNumber, userAddress } = req.body;

    const existingUser = await User.findOne({ userEmail });
    if (existingUser) throw new ApiError(400, "User already exists");

    let profileImageKey = null;
    let profileSignedUrl = null;

    if (req.file) {
        try {
            const uploadResult = await S3UploadHelper.uploadFile(req.file, "user-profile");
            if (uploadResult?.key) {
                profileImageKey = uploadResult.key;
                profileSignedUrl = await S3UploadHelper.getSignedUrl(uploadResult.key);
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            throw new ApiError(500, "Error uploading profile image");
        }
    }

    const user = await User.create({
        userName,
        userEmail,
        userPassword,
        userRole: userRole || "buyer",
        phoneNumber,
        userAddress,
        userIsVerified:false, //userRole === "admin" ? true : false,
        ...(profileImageKey && { profileImage: profileImageKey })
    });

    if (!user) throw new ApiError(400, "User creation failed");

    // ---------------- Email Verification Token ---------------- //
    if (userRole !== "admin") {
        const { hashedToken, tokenExpiry } = user.generateTemporaryToken();

        user.userVerificationToken = hashedToken;
        user.userVerificationTokenExpiry = tokenExpiry;
        await user.save();

        const verificationLink = `${process.env.CLIENT_URL}/api/v1/auth/verify/${hashedToken}`;

        await mailTransporter.sendMail({
            from: process.env.MAILTRAP_SENDEREMAIL,
            to: userEmail,
            subject: "Verify your email",
            html: userVerificationMailBody(userName, verificationLink)
        });
    }

    const response = {
        userId: user._id,
        userName: user.userName,
        userEmail: user.userEmail,
        userRole: user.userRole,
        phoneNumber: user.phoneNumber,
        userAddress: user.userAddress,
        ...(profileSignedUrl && { profileImageUrl: profileSignedUrl }),
    };

    return res.status(201).json(new ApiResponse(201, response, "User registered successfully"));
});

//-------------------- VERIFY EMAIL --------------------//
const verifyUserEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;

    const user = await User.findOne({
        userVerificationToken: token,
        userVerificationTokenExpiry: { $gt: Date.now() }
    });

    if (!user) throw new ApiError(400, "Invalid or expired verification token");

    user.userIsVerified = true;
    user.userVerificationToken = null;
    user.userVerificationTokenExpiry = null;

    await user.save();

    return res.status(200).json(new ApiResponse(200, {}, "Email verified successfully"));
});

//-------------------- LOGIN --------------------//
const loginUser = asyncHandler(async (req, res) => {
    const { userEmail, userPassword } = req.body;

    const user = await User.findOne({ userEmail });
    if (!user) throw new ApiError(400, "User not found");

    const isPasswordCorrect = await user.isPasswordCorrect(userPassword);
    if (!isPasswordCorrect) throw new ApiError(400, "Invalid password");

    if (!user.userIsVerified) throw new ApiError(400, "User not verified");

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    storeLoginCookies(res, accessToken, refreshToken, user.userRole);

    user.userRefreshToken = refreshToken;
    await user.save();

    let profileSignedUrl = null;
    if (user.profileImage) {
        try {
            profileSignedUrl = await S3UploadHelper.getSignedUrl(user.profileImage);
        } catch {}
    }

    const response = {
        user: {
            userId: user._id,
            userName: user.userName,
            userEmail: user.userEmail,
            userRole: user.userRole,
            phoneNumber: user.phoneNumber,
            userAddress: user.userAddress,
            profileImage: profileSignedUrl
        },
        tokens: { accessToken, refreshToken }
    };

    return res.status(200).json(new ApiResponse(200, response, "Login successful"));
});

//-------------------- LOGOUT --------------------//
const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) throw new ApiError(401, "Not authenticated");

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    user.userRefreshToken = null;
    await user.save();

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.status(200).json(new ApiResponse(200, {}, "Logged out successfully"));
});

//-------------------- REFRESH ACCESS TOKEN --------------------//
const getAccessToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) throw new ApiError(400, "Refresh token missing");

    const user = await User.findOne({ userRefreshToken: refreshToken });
    if (!user) throw new ApiError(400, "Invalid refresh token");

    const newAccessToken = user.generateAccessToken();

    storeAccessToken(res, newAccessToken, user.userRole);

    return res.status(200).json(new ApiResponse(200, { accessToken: newAccessToken }, "New access token issued"));
});

//-------------------- FORGOT PASSWORD --------------------//
const forgotPasswordMail = asyncHandler(async (req, res) => {
    const { userEmail } = req.body;

    const user = await User.findOne({ userEmail });
    if (!user) throw new ApiError(400, "User not found");

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();
    user.userPasswordResetToken = hashedToken;
    user.userPasswordExpirationDate = tokenExpiry;

    await user.save();

    const resetLink = `${process.env.BASE_URL}/api/v1/auth/reset-password/${unHashedToken}`;

    await mailTransporter.sendMail({
        from: process.env.MAILTRAP_SENDEREMAIL,
        to: userEmail,
        subject: "Password Reset",
        html: userForgotPasswordMailBody(user.userName, resetLink),
    });

    return res.status(200).json(new ApiResponse(200, { resetLink }, "Password reset link sent"));
});

//-------------------- RESET PASSWORD --------------------//
const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { userPassword } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        userPasswordResetToken: hashedToken,
        userPasswordExpirationDate: { $gt: Date.now() }
    });

    if (!user) throw new ApiError(400, "Invalid or expired reset token");

    user.userPassword = userPassword;
    user.userPasswordResetToken = null;
    user.userPasswordExpirationDate = null;

    await user.save();

    return res.status(200).json(new ApiResponse(200, {}, "Password reset successfully"));
});

export {
    registerUser,
    verifyUserEmail,
    loginUser,
    logoutUser,
    getAccessToken,
    forgotPasswordMail,
    resetPassword
};
