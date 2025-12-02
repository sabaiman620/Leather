import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    type: { 
        type: String, 
        required: true, 
        enum: ["men", "women", "kids"] 
    },
    name: { 
        type: String, 
        required: true 
    },
    slug: { 
        type: String, 
        unique: true 
    },
    description: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

categorySchema.pre("save", function (next) {
    if (!this.slug) {
        this.slug = `${this.type}-${this.name}`
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/--+/g, "-");
    }
    next();
});

const Category = mongoose.model("Category", categorySchema);
export default Category;
