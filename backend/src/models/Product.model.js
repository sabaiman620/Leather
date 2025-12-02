import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    image: { type: String, default: "" },
    productName: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },

    description: { type: String },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    sizes: [{ type: String }], // Example: ["6","7","8","9"] or ["S","M","L"]
    colors: [{ type: String }],

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    // images: [{ type: String }],

    isActive: { type: Boolean, default: true },

}, { timestamps: true });

//---------------- SLUG AUTO-GENERATION ----------------//
productSchema.pre("save", function(next) {
    if (!this.slug) {
        this.slug = this.productName
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/--+/g, "-");
    }
    next();
});

const Product = mongoose.model("Product", productSchema);
export default Product;
