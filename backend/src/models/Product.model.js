import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    productName: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    images: [{ type: String }],
    variants: [{ type: mongoose.Schema.Types.ObjectId, ref: "ProductVariant" }],
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);
export default Product;
