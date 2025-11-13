import { Router } from "express";
import { articleLikeController } from "../../http/controllers/articleLike.controller.js";
import { authorizeAdmin, authorizeRequest } from "../../http/middlewares/auth.middleware.js";

const articleLikeAdminRouter = Router();

articleLikeAdminRouter.use(authorizeRequest, authorizeAdmin);

articleLikeAdminRouter.route("/:id")
    .get(articleLikeController.getArticleLikerListAdmin);

export { articleLikeAdminRouter };