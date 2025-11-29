import { z } from "zod";

const createProductSchema = z.object({
    productName: z.string().min(3, "Product name must be at least 3 characters long"),
    description: z.string().min(5, "Description must be at least 5 characters long"),
    price: z.number().min(0, "Price must be greater than 0"),
    discount: z.number().min(0).optional(),
    stock: z.number().min(0, "Stock cannot be negative"),
    category: z.string().min(1, "Category is required")
});

const updateProductSchema = createProductSchema.partial();

export { createProductSchema, updateProductSchema };
