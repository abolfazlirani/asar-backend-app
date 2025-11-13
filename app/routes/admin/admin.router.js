import { Router } from "express";
import { userRouter } from "../api/user.router.js";
import { remoteConfigAdminRouter } from "./remote_config.router.js";
import { postCategoryAdminRouter } from "./post.category.admin.router.js";
import { articleAdminRouter } from "./article.admin.router.js";
import { commentAdminRouter } from "./comment.admin.router.js";
import { articleBookmarkAdminRouter } from "./article.bookmark.admin.router.js";
import { articleLikeAdminRouter } from "./article.like.admin.router.js";

const adminRouter = Router();

adminRouter.use(userRouter);
adminRouter.use("/remote_config", remoteConfigAdminRouter);
adminRouter.use("/categories", postCategoryAdminRouter);
adminRouter.use("/articles", articleAdminRouter);
adminRouter.use("/comments", commentAdminRouter);
adminRouter.use("/article_bookmarks", articleBookmarkAdminRouter);
adminRouter.use("/article_likes", articleLikeAdminRouter);

export {
    adminRouter
}