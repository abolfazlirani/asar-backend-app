import { Router } from "express";
import { commentController } from "../../http/controllers/comment.controller.js";
import { authorizeAdmin, authorizeRequest } from "../../http/middlewares/auth.middleware.js";
import multer from "multer";

const commentAdminRouter = Router();

commentAdminRouter.use(authorizeRequest, authorizeAdmin);

commentAdminRouter.route("/")
    .get(commentController.getAllCommentsAdmin);

commentAdminRouter.route("/:id")
    .put(multer().none(), commentController.updateCommentAdmin)
    .delete(commentController.deleteCommentAdmin);

export { commentAdminRouter };