import { z } from "zod";

const createProductSchema = z.object({
    productName: z.string().min(3, "Product name must be at least 3 characters"),
    description: z.string().min(5, "Description must be at least 5 characters"),
    
    // Numbers from form-data → strings → transform to Number
    price: z.string()
        .nonempty("Price is required")
        .transform((val) => Number(val))
        .refine((n) => !isNaN(n) && n >= 0, "Price must be a valid number"),
    
    discount: z.string().optional()
        .transform((val) => (val ? Number(val) : 0))
        .refine((n) => n >= 0, "Discount must be 0 or more"),
    
    stock: z.string()
        .nonempty("Stock is required")
        .transform((val) => Number(val))
        .refine((n) => !isNaN(n) && n >= 0, "Stock must be a valid number"),
    
    category: z.string().min(1, "Category is required"),

    // Arrays from form-data: accept either a comma-separated string or an array of strings
    sizes: z.union([z.string(), z.array(z.string())]).optional()
        .transform((val) => {
            if (!val) return [];
            if (Array.isArray(val)) return val;
            return val.split(",");
        }),

    colors: z.union([z.string(), z.array(z.string())]).optional()
        .transform((val) => {
            if (!val) return [];
            if (Array.isArray(val)) return val;
            return val.split(",");
        }),
    
    images: z
    .string()
    .url("Product image must be a valid URL")
    .optional(),

    // isActive from form-data → "true"/"false"
    isActive: z.string().optional()
        .transform((val) => val === "true")
});

const updateProductSchema = createProductSchema.partial();

export { createProductSchema, updateProductSchema };
