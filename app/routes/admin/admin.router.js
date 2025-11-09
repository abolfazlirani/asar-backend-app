import { Router } from "express";
import {userRouter} from "../api/user.router.js";

const adminRouter = Router();

adminRouter.use(userRouter);

export {
    adminRouter
}
