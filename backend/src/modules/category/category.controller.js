import { asyncHandler } from "../../core/utils/async-handler.js";
import Category from "../../models/Category.model.js";
import { ApiError } from "../../core/utils/api-error.js";
import { ApiResponse } from "../../core/utils/api-response.js";
import { generateSlug } from "../../core/utils/generateSlug.js";

//-------------------- CREATE CATEGORY --------------------//
const createCategory = asyncHandler(async (req, res) => {
    const { name, description, parentCategory } = req.body;

    const existing = await Category.findOne({ name });
    if (existing) throw new ApiError(400, "Category already exists");

    const category = await Category.create({
        name,
        slug: generateSlug(name),
        description,
        parentCategory: parentCategory || null
    });

    return res.status(201).json(new ApiResponse(201, category, "Category created successfully"));
});

//-------------------- GET CATEGORIES --------------------//
const getCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find().populate("parentCategory");
    return res.status(200).json(new ApiResponse(200, categories, "Categories fetched successfully"));
});

//-------------------- UPDATE CATEGORY --------------------//
const updateCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) throw new ApiError(404, "Category not found");

    const { name, description, parentCategory } = req.body;
    category.name = name || category.name;
    category.description = description || category.description;
    category.slug = name ? generateSlug(name) : category.slug;
    category.parentCategory = parentCategory || category.parentCategory;

    await category.save();
    return res.status(200).json(new ApiResponse(200, category, "Category updated successfully"));
});

//-------------------- DELETE CATEGORY --------------------//
const deleteCategory = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) throw new ApiError(404, "Category not found");

    await category.remove();
    return res.status(200).json(new ApiResponse(200, {}, "Category deleted successfully"));
});

export { createCategory, getCategories, updateCategory, deleteCategory };
