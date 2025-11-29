import Router from "express";
import { upload } from "../../core/middleware/multer.js";
import { isLoggedIn } from "../../core/middleware/isLoggedIn.js";
import { isAdmin } from "../../core/middleware/role.middleware.js";
import { validate } from "../../core/middleware/validate.js";
import { createProductSchema, updateProductSchema } from "../../shared/validators/product.validator.js";
import { createProduct, getProducts, getProduct, updateProduct, deleteProduct } from "./product.controller.js";

const productRouter = Router();

//-------------------- PUBLIC ROUTES --------------------//
productRouter.get("/", getProducts);
productRouter.get("/:id", getProduct);

//-------------------- ADMIN ROUTES --------------------//
productRouter.post("/", isLoggedIn, isAdmin, upload.array("images"), validate(createProductSchema), createProduct);
productRouter.put("/:id", isLoggedIn, isAdmin, upload.array("images"), validate(updateProductSchema), updateProduct);
productRouter.delete("/:id", isLoggedIn, isAdmin, deleteProduct);

export default productRouter;
