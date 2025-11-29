import { asyncHandler } from "../../core/utils/async-handler.js";
import Product from "../../models/Product.model.js";
import ProductVariant from "../../models/ProductVariant.model.js";
import Category from "../../models/category.model.js";
import { ApiError } from "../../core/utils/api-error.js";
import { ApiResponse } from "../../core/utils/api-response.js";
import S3UploadHelper from "../../shared/helpers/s3Upload.js";
import { generateSlug } from "../../core/utils/generateSlug.js";
//-------------------- CREATE PRODUCT --------------------//
const createProduct = asyncHandler(async (req, res) => {
    const { productName, description, price, discount, stock, category } = req.body;

    const categoryExists = await Category.findById(category);
    if (!categoryExists) throw new ApiError(400, "Category not found");

    let images = [];
    if (req.files) {
        for (let file of req.files) {
            const uploadResult = await S3UploadHelper.uploadFile(file, "products");
            images.push(uploadResult.key);
        }
    }

    const product = await Product.create({
        productName,
        slug: generateSlug(productName),
        description,
        price,
        discount,
        stock,
        category,
        images
    });

    return res.status(201).json(new ApiResponse(201, product, "Product created successfully"));
});

//-------------------- GET ALL PRODUCTS --------------------//
const getProducts = asyncHandler(async (req, res) => {
    const products = await Product.find().populate("category").populate("variants");
    return res.status(200).json(new ApiResponse(200, products, "Products fetched successfully"));
});

//-------------------- GET SINGLE PRODUCT --------------------//
const getProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id).populate("category").populate("variants");
    if (!product) throw new ApiError(404, "Product not found");
    return res.status(200).json(new ApiResponse(200, product, "Product fetched successfully"));
});

//-------------------- UPDATE PRODUCT --------------------//
const updateProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw new ApiError(404, "Product not found");

    const { productName, description, price, discount, stock, category } = req.body;

    if (category) {
        const categoryExists = await Category.findById(category);
        if (!categoryExists) throw new ApiError(400, "Category not found");
        product.category = category;
    }

    product.productName = productName || product.productName;
    product.description = description || product.description;
    product.price = price || product.price;
    product.discount = discount || product.discount;
    product.stock = stock || product.stock;
    if (productName) product.slug = generateSlug(productName);

    if (req.files) {
        let images = [];
        for (let file of req.files) {
            const uploadResult = await S3UploadHelper.uploadFile(file, "products");
            images.push(uploadResult.key);
        }
        product.images = images;
    }

    await product.save();
    return res.status(200).json(new ApiResponse(200, product, "Product updated successfully"));
});

//-------------------- DELETE PRODUCT --------------------//
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) throw new ApiError(404, "Product not found");

    await product.remove();
    return res.status(200).json(new ApiResponse(200, {}, "Product deleted successfully"));
});

export { createProduct, getProducts, getProduct, updateProduct, deleteProduct };
