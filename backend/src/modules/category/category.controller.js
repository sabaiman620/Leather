import { asyncHandler } from "../../core/utils/async-handler.js";
import Category from "../../models/Category.model.js";
import { ApiError } from "../../core/utils/api-error.js";
import { ApiResponse } from "../../core/utils/api-response.js";

//-------------------- CREATE CATEGORY --------------------//
const createCategory = asyncHandler(async (req, res) => {
    const { name, description, type } = req.body;

    const existing = await Category.findOne({ name, type });
    if (existing) throw new ApiError(400, "Category with this name already exists for this type.");

    const category = await Category.create({ name, description, type });

    return res
        .status(201)
        .json(new ApiResponse(201, category, "Category created successfully"));
});

const updateCategory = asyncHandler(async (req, res) => {
    const { name, description, type, isActive } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) throw new ApiError(404, "Category not found");

    if (name) category.name = name;
    if (description) category.description = description;
    if (type) category.type = type;

    // Handle boolean from string
    if (isActive !== undefined) {
        if (typeof isActive === "boolean") category.isActive = isActive;
        else if (typeof isActive === "string")
            category.isActive = isActive.toLowerCase() === "true";
    }

    await category.save();

    return res
        .status(200)
        .json(new ApiResponse(200, category, "Category updated successfully"));
});


//-------------------- GET CATEGORy --------------------//
const getCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) throw new ApiError(404, "Category not found");
    return res.status(200).json(new ApiResponse(200, category, "Category fetched successfully"));
});


//-------------------- GET CATEGORIES (PUBLIC & ADMIN) --------------------//
const getAllCategories = asyncHandler(async (req, res) => {
    const { type, all } = req.query;

    // By default, only active categories are shown
    const filter = { isActive: true };

    // Admin users can see all if ?all=true
    if (req.user?.role === "admin" && all === "true") {
        delete filter.isActive; // show all categories
    }

    if (type) filter.type = type;

    const categories = await Category.find(filter).sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, categories, "Categories fetched successfully"));
});

//-------------------- DELETE CATEGORY --------------------//
const deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) throw new ApiError(404, "Category not found");

    await category.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Category deleted successfully"));
});

export { createCategory, getAllCategories, getCategory, updateCategory, deleteCategory };
