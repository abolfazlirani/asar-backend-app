import { Router } from "express";
import { articleLikeController } from "../../http/controllers/articleLike.controller.js";
import { authorizeRequest } from "../../http/middlewares/auth.middleware.js";
import multer from "multer";

const articleLikeApiRouter = Router();

articleLikeApiRouter.use(authorizeRequest);

articleLikeApiRouter.route("/")
    .get(articleLikeController.getMyLikedArticles);

articleLikeApiRouter.route("/:id")
    .post(multer().none(), articleLikeController.toggleLike);

articleLikeApiRouter.route("/:id/status")
    .get(articleLikeTwoController.getArticleLikeStatus);

export { articleLikeApiRouter };