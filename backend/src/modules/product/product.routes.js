import Router from "express";
import { upload } from "../../core/middleware/multer.js";
import { isLoggedIn } from "../../core/middleware/isLoggedIn.js";
import { isAdmin } from "../../core/middleware/isAdmin.js";
import { validate } from "../../core/middleware/validate.js";
import { createProductSchema, updateProductSchema } from "../../shared/validators/product.validator.js";
import { 
    createProduct, 
    getAllProducts, 
    updateProduct, 
    getProductById, 
    deleteProduct, 
    getByCategory, 
    searchProductByName 
} from "./product.controller.js";

const productRouter = Router();

productRouter.get("/getAll", getAllProducts);
productRouter.get("/get/:id", getProductById);
productRouter.get("/category/:category", getByCategory);
productRouter.get("/search", searchProductByName);
productRouter.post("/create", isLoggedIn, isAdmin, upload.array("image"), validate(createProductSchema), createProduct);
productRouter.put("/update/:id", isLoggedIn, isAdmin, upload.array("image"), validate(updateProductSchema), updateProduct);
productRouter.delete("/delete/:id", isLoggedIn, isAdmin, deleteProduct);

export default productRouter;
