import { asyncHandler } from "../../core/utils/async-handler.js";
import crypto from "crypto";
import User from "../../models/User.model.js";
import { ApiError } from "../../core/utils/api-error.js";
import { ApiResponse } from "../../core/utils/api-response.js";
import { userForgotPasswordMailBody } from "../../shared/constants/mail.constant.js";
import { mailTransporter } from "../../shared/helpers/mail.helper.js";
import { storeLoginCookies, storeAccessToken } from "../../shared/helpers/cookies.helper.js";
import S3UploadHelper from "../../shared/helpers/s3Upload.js";

//-------------------- REGISTER --------------------//
const registerUser = asyncHandler(async (req, res) => {
    const { userName, userEmail, userPassword, userRole, phoneNumber, userAddress } = req.body;

    const existingUser = await User.findOne({ userEmail });
    if (existingUser) throw new ApiError(400, "User already exists");

    let uploadResult = null;
    if (req.file) {
        try {
            uploadResult = await S3UploadHelper.uploadFile(req.file, "avatar");
        } catch (error) {
            console.error("Error uploading avatar:", error);
            throw new ApiError(500, "Error uploading avatar to S3");
        }
    }

    const user = await User.create({
        userName,
        userEmail,
        userPassword,
        userRole: userRole || "buyer",
        phoneNumber,
        userAddress,
        userIsVerified: userRole === "admin" ? true : false, // auto-verify admin
        profileImage: uploadResult ? uploadResult.key : undefined
    });

    const userResponse = user.toObject();
    delete userResponse.userPassword;

    if (uploadResult) {
        try {
            userResponse.avatarUrl = await S3UploadHelper.getSignedUrl(uploadResult.key);
        } catch {
            userResponse.avatarUrl = null;
        }
    }

    return res
        .status(201)
        .json(new ApiResponse(201, userResponse, "User registered successfully"));
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

    let signedProfileImageUrl = null;
    if (user.profileImage) {
        try {
            signedProfileImageUrl = await S3UploadHelper.getSignedUrl(user.profileImage);
        } catch (err) {
            signedProfileImageUrl = null;
        }
    }

    const response = {
        user: {
            userId: user._id,
            userName: user.userName,
            userEmail: user.userEmail,
            userRole: user.userRole,
            phoneNumber: user.phoneNumber,
            profileImage: signedProfileImageUrl || null
        },
        tokens: { accessToken, refreshToken }
    };

    return res
        .status(200)
        .json(new ApiResponse(200, response, "User logged in successfully"));
});

//-------------------- LOGOUT --------------------//
const logoutUser = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) throw new ApiError(401, "User not authenticated");

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    user.userRefreshToken = null;
    await user.save();

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

//-------------------- REFRESH TOKEN --------------------//
const getAccessToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies;
    if (!refreshToken) throw new ApiError(400, "Refresh token not found");

    const user = await User.findOne({ userRefreshToken: refreshToken });
    if (!user) throw new ApiError(400, "Invalid refresh token");

    const accessToken = user.generateAccessToken();
    storeAccessToken(res, accessToken, user.userRole);

    return res
        .status(200)
        .json(new ApiResponse(200, { accessToken }, "Access token generated successfully"));
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

    const passwordResetLink = `${process.env.BASE_URL}/api/v1/auth/reset-password/${unHashedToken}`;

    await mailTransporter.sendMail({
        from: process.env.MAILTRAP_SENDEREMAIL,
        to: userEmail,
        subject: "Forgot password",
        html: userForgotPasswordMailBody(user.userName, passwordResetLink)
    });

    return res
        .status(200)
        .json(new ApiResponse(200, { passwordResetLink }, "Password reset link sent successfully"));
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
    if (!user) throw new ApiError(400, "Invalid or expired password reset token");

    user.userPassword = userPassword;
    user.userPasswordResetToken = null;
    user.userPasswordExpirationDate = null;
    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password reset successfully"));
});

export { registerUser, loginUser, logoutUser, getAccessToken, forgotPasswordMail, resetPassword };
