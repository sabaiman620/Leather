import { ApiError } from "../../core/utils/api-error.js";
import { ApiResponse } from "../../core/utils/api-response.js";
import { asyncHandler } from "../../core/utils/async-handler.js";
import User from "../../models/User.model.js";
const getAllUsers = asyncHandler(async (req, res) => {

    const users = await User.find()

    if (!users) {
        throw new ApiError(400, "User not found");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                users,
                "User retrived successfully"
            )
        );

})

export { getAllUsers }