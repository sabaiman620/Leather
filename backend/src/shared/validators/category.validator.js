import { z } from "zod";

const createCategorySchema = z.object({
    name: z.string().min(2, "Category name must be at least 2 characters"),
    description: z.string().optional(),
    type: z.enum(["men", "women", "kids"], {
        required_error: "Category type is required",
        invalid_type_error: "Invalid category type"
    }),

    parentCategory: z.string().optional()
});

const updateCategorySchema = createCategorySchema.partial();

export { createCategorySchema, updateCategorySchema };
