import Router from "express";
import { isLoggedIn } from "../../core/middleware/isLoggedIn.js";
import { isAdmin } from "../../core/middleware/isAdmin.js";
import { validate } from "../../core/middleware/validate.js";
import { createCategorySchema, updateCategorySchema } from "../../shared/validators/category.validator.js";
import { createCategory, getAllCategories, getCategory, updateCategory, deleteCategory } from "./category.controller.js";

const categoryRouter = Router();

//-------------------- PUBLIC ROUTES --------------------//
categoryRouter.get("/", getAllCategories);

//-------------------- ADMIN ROUTES --------------------//
categoryRouter.get("/:id", isLoggedIn, isAdmin, getCategory);// admin route to fetch all categories
categoryRouter.post("/create", isLoggedIn, isAdmin, validate(createCategorySchema), createCategory);
// categoryRouter.post("/create", validate(createCategorySchema), createCategory);
categoryRouter.put("/:id", isLoggedIn, isAdmin, validate(updateCategorySchema), updateCategory);
categoryRouter.delete("/:id", isLoggedIn, isAdmin, deleteCategory);

export default categoryRouter;
