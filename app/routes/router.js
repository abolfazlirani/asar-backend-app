import { Router } from "express";
import { authRouter } from "./api/auth.router.js";
import { adminRouter } from "./admin/admin.router.js";
import { remoteConfigRouter } from "./api/remote.config.router.js";
import { postCategoryApiRouter } from "./api/post.category.api.router.js";
import { articleApiRouter } from "./api/article.api.router.js";
import { commentApiRouter } from "./api/comment.api.router.js";

const mainRouter = Router();

mainRouter.use('/auth', authRouter);
mainRouter.use('/remote_config', remoteConfigRouter);
mainRouter.use('/categories', postCategoryApiRouter);
mainRouter.use('/articles', articleApiRouter);
mainRouter.use('/comments', commentApiRouter);
mainRouter.use('/admin', adminRouter);

export {
    mainRouter
}