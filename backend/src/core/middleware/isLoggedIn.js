import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
const isLoggedIn = asyncHandler(async(req, res, next) => {

     const accessToken =
    req.cookies?.userAccessToken || req.cookies?.adminAccessToken;

    if (!accessToken) {
        throw new ApiError(401, "Unauthorized , No token found in cookies");
    }
      try {
    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded;
    console.log("Decoded User:", decoded);
    next();
  } catch (error) {
    console.error("JWT Verification Failed:", error.message);
    throw new ApiError(401, "Invalid or expired token");
  }
})
export { isLoggedIn };
