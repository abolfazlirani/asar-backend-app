import { Router } from "express";
import { userRouter } from "../api/user.router.js";
import { remoteConfigAdminRouter } from "./remote_config.router.js";
import { postCategoryAdminRouter } from "./post.category.admin.router.js";
import { articleAdminRouter } from "./article.admin.router.js";

const adminRouter = Router();

adminRouter.use(userRouter);
adminRouter.use("/remote_config", remoteConfigAdminRouter);
adminRouter.use("/categories", postCategoryAdminRouter);
adminRouter.use("/articles", articleAdminRouter);

export {
    adminRouter
}