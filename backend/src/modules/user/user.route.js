import Router from "express"
import { getAllUsers } from "./user.controller.js"

const userRouter = Router()

userRouter.get("/all-users", getAllUsers)

export default userRouter