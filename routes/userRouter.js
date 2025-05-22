import { Router } from "express";
import { adminLogin, registerAdmin, registerUser, userLogin } from "../controllers/userController.js";

const userRouter = Router()

userRouter.post('/user/register', registerUser)
userRouter.post('/admin/register', registerAdmin)
userRouter.post('/user/login', userLogin)
userRouter.post('/admin/login', adminLogin)



export default userRouter