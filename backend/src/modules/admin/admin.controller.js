// controllers/admin/admin.controller.js

import User from "../../models/user.model.js";
import Review from "../../models/review/review.model.js";
import Order from "../../models/order/order.model.js";
import Transaction from "../../models/transaction/transaction.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/async-handler.js";
import S3UploadHelper from "../../utils/S3UploadHelper.js";

// GET ADMIN PROFILE (since only one admin)
export const getAdminProfile = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user._id);
  return res.status(200).json(new ApiResponse(200, admin));
});

// UPDATE ADMIN PROFILE
export const updateAdminProfile = asyncHandler(async (req, res) => {
  const updates = req.body;

  const admin = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true }
  );

  return res.status(200).json(new ApiResponse(200, admin, "Profile updated"));
});

// UPDATE PROFILE IMAGE
export const updateAdminProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Image is required");

  const upload = await S3UploadHelper.uploadFile(req.file);

  const admin = await User.findByIdAndUpdate(
    req.user._id,
    { profileImage: upload.Location },
    { new: true }
  );

  return res.status(200).json(new ApiResponse(200, admin, "Image uploaded"));
});

// DELETE PROFILE IMAGE
export const deleteAdminProfileImage = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user._id);

  admin.profileImage = null;
  await admin.save();

  return res.status(200).json(new ApiResponse(200, admin, "Image removed"));
});

// TOGGLE BUYER STATUS (Block/Unblock)
export const toggleBuyerStatus = asyncHandler(async (req, res) => {
  const buyer = await User.findById(req.params.id);
  if (!buyer) throw new ApiError(404, "Buyer not found");

  buyer.isActive = !buyer.isActive;
  await buyer.save();

  return res.status(200).json(
    new ApiResponse(200, buyer, `Buyer status updated (${buyer.isActive})`)
  );
});

// GET PENDING REVIEWS
export const getPendingReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ status: "pending" });
  return res.status(200).json(new ApiResponse(200, reviews));
});

// DASHBOARD STATS
export const getDashboardStats = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const totalBuyers = await Buyer.countDocuments();
  const totalTransactions = await Transaction.countDocuments();
  const totalPendingReviews = await Review.countDocuments({ status: "pending" });

  return res.status(200).json(
    new ApiResponse(
      200,
      { totalOrders, totalBuyers, totalTransactions, totalPendingReviews },
      "Dashboard stats loaded"
    )
  );
});
