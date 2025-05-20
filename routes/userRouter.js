import { Router } from "express";
import { registerUser, userLogin } from "../controllers/userController.js";

const userRouter = Router()

userRouter.post('/user/register', registerUser)
userRouter.post('/user/login', userLogin)



export default userRouter