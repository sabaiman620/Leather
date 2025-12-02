import express from "express";
import dotenv from "dotenv"
import cors from "cors"
import cookieParser from "cookie-parser";
import { errorHandler } from "./src/core/middleware/errorHandler.js";
import authRouter from "./src/modules/auth/auth.route.js";
import productRouter from "./src/modules/product/product.routes.js";
// import variantRouter from "./src/modules/productVariant/productVariant.routes.js";
import categoryRouter from "./src/modules/category/category.routes.js";
import reviewRouter from "./src/modules/reviews/review.routes.js";
import orderRouter from "./src/modules/order/order.routes.js";
import paymentRouter from "./src/modules/payment/payment.routes.js";
import transactionRouter from "./src/modules/transaction/transaction.routes.js";


const app = express()

dotenv.config()

app.use(cors({
  origin: "http://localhost:5173",  // your React app
  credentials: true,                // allow cookies / tokens
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


// app.use(cors());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));


app.use("/api/v1/auth", authRouter)
app.use("/api/v1/products", productRouter);
// app.use("/api/v1/variants", variantRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/transactions", transactionRouter);



app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: '🚀 Server is running smoothly - Module Structure',
        timestamp: new Date().toISOString()
    });
});

app.use(errorHandler)

export default app

