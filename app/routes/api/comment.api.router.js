import { Router } from "express";
import { commentController } from "../../http/controllers/comment.controller.js";
import { authorizeRequest } from "../../http/middlewares/auth.middleware.js";
// import { authorizeRequestOptional } from "../../http/middlewares/auth.middleware.js";
import multer from "multer";

const commentApiRouter = Router();

commentApiRouter.route("/")
    .post(authorizeRequest, multer().none(), commentController.createComment);

commentApiRouter.route("/article/:articleId")
    .get(commentController.getCommentsForArticle);
// .get(authorizeRequestOptional, commentController.getCommentsForArticle);

commentApiRouter.route("/:id/like")
    .post(authorizeRequest, multer().none(), commentController.likeComment);

commentApiRouter.route("/:id/status")
    .get(authorizeRequest, commentController.getCommentLikeStatus);

export { commentApiRouter };