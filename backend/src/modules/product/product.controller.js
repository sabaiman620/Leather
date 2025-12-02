import { asyncHandler } from "../../core/utils/async-handler.js";
import Product from "../../models/Product.model.js";
import { ApiError } from "../../core/utils/api-error.js";
import { ApiResponse } from "../../core/utils/api-response.js";
import S3UploadHelper from "../../shared/helpers/s3Upload.js";

//---------------- CREATE PRODUCT ----------------//
const createProduct = asyncHandler(async (req, res) => {
    const { productName, description, price, discount, stock, category, sizes, colors, isActive } = req.body;

    if (!productName || !price || !category) {
        throw new ApiError(400, "Product name, price & category are required");
    }

    let imageKey = "";
    let imageUrl = "";
    if (req.file) {
        const uploadResult = await S3UploadHelper.uploadFile(req.file, "product-images");
        if (uploadResult?.key) {
            imageKey = uploadResult.key;
            imageUrl = await S3UploadHelper.getSignedUrl(imageKey);
        }
    }

    const product = await Product.create({
        productName,
        description,
        price,
        discount,
        stock,
        category,
        sizes,
        colors,
        image: imageKey,
        isActive: isActive ?? true
    });

    return res.status(201).json(new ApiResponse(
        201,
        { product, imageUrl },
        "Product created successfully"
    ));
});


// ----------------- UPDATE PRODUCT --------------------- //
const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { productName, description, price, discount, stock, category, sizes, colors, isActive } = req.body;

    const product = await Product.findById(id);
    if (!product) throw new ApiError(404, "Product not found");

    if (req.file) {
        const uploadResult = await S3UploadHelper.uploadFile(req.file, "product-images");
        if (uploadResult?.key) product.image = uploadResult.key;
    }

    product.productName = productName ?? product.productName;
    product.description = description ?? product.description;
    product.price = price ?? product.price;
    product.discount = discount ?? product.discount;
    product.stock = stock ?? product.stock;
    product.category = category ?? product.category;
    product.sizes = sizes ?? product.sizes;
    product.colors = colors ?? product.colors;
    product.isActive = isActive ?? product.isActive;

    await product.save();

    const imageUrl = product.image ? await S3UploadHelper.getSignedUrl(product.image) : "";

    return res.status(200).json(new ApiResponse(
        200,
        { product, imageUrl },
        "Product updated successfully"
    ));
});

// -------GET ALL PRODUCTS (ACTIVE ONLY)------- //
const getAllProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });

    const productsWithSignedUrls = await Promise.all(
        products.map(async (p) => {
            const imageUrls = await Promise.all(
                p.image.map((key) => S3UploadHelper.getSignedUrl(key))
            );
            return { ...p._doc, productImageUrls: imageUrls };
        })
    );

    return res.status(200).json(new ApiResponse(200, productsWithSignedUrls, "All active products fetched"));
});

// --------GET PRODUCT BY ID (ONLY ACTIVE)---------- //
const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, isActive: true });
    if (!product) throw new ApiError(404, "Product not found or inactive");

    const signedUrls = await Promise.all(
        product.image.map((key) => S3UploadHelper.getSignedUrl(key))
    );

    return res.status(200).json(new ApiResponse(
        200,
        { product, productImageUrls: signedUrls },
        "Success"
    ));
});

//-------- GET BY CATEGORY (ACTIVE ONLY)------- //
const getByCategory = asyncHandler(async (req, res) => {
    const { category } = req.params;
    const products = await Product.find({ category, isActive: true });

    const productsWithUrls = await Promise.all(
        products.map(async (p) => {
            const urls = await Promise.all(p.image.map((key) => S3UploadHelper.getSignedUrl(key)));
            return { ...p._doc, productImageUrls: urls };
        })
    );

    return res.status(200).json(new ApiResponse(200, productsWithUrls, "Success"));
});

// -------- SEARCH PRODUCT BY NAME (ACTIVE ONLY) -------- //
const searchProductByName = asyncHandler(async (req, res) => {
    const { name } = req.query;
    if (!name) throw new ApiError(400, "Search query is required");

    const products = await Product.find({
        name: { $regex: name, $options: "i" },
        isActive: true
    });

    const productsWithUrls = await Promise.all(
        products.map(async (p) => {
            const urls = await Promise.all(p.image.map((key) => S3UploadHelper.getSignedUrl(key)));
            return { ...p._doc, productImageUrls: urls };
        })
    );

    return res.status(200).json(new ApiResponse(200, productsWithUrls, "Search results"));
});

// -------DELETE PRODUCT------ //
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) throw new ApiError(404, "Product not found");

    return res.status(200).json(new ApiResponse(200, {}, "Product deleted successfully"));
});

export {
    createProduct,
    updateProduct,
    getAllProducts,
    getProductById,
    getByCategory,
    searchProductByName,
    deleteProduct
};
