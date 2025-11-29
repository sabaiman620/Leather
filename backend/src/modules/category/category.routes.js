import Router from "express";
import { isLoggedIn } from "../../core/middleware/isLoggedIn.js";
import { isAdmin } from "../../core/middleware/role.middleware.js";
import { validate } from "../../core/middleware/validate.js";
import { createCategorySchema, updateCategorySchema } from "../../shared/validators/category.validator.js";
import { createCategory, getCategories, updateCategory, deleteCategory } from "./category.controller.js";

const categoryRouter = Router();

//-------------------- PUBLIC ROUTES --------------------//
categoryRouter.get("/", getCategories);

//-------------------- ADMIN ROUTES --------------------//
categoryRouter.post("/", isLoggedIn, isAdmin,validate(createCategorySchema), createCategory);
categoryRouter.put("/:id", isLoggedIn, isAdmin,validate(updateCategorySchema), updateCategory);
categoryRouter.delete("/:id", isLoggedIn, isAdmin, deleteCategory);

export default categoryRouter;
