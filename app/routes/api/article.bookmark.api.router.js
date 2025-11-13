import { Router } from "express";
import { articleBookmarkController } from "../../http/controllers/articleBookmark.controller.js";
import { authorizeRequest } from "../../http/middlewares/auth.middleware.js";
import multer from "multer";

const articleBookmarkApiRouter = Router();

articleBookmarkApiRouter.use(authorizeRequest);

articleBookmarkApiRouter.route("/")
    .get(articleBookmarkController.getMyBookmarks);

articleBookmarkApiRouter.route("/:id")
    .post(multer().none(), articleBookmarkController.toggleBookmark);

export { articleBookmarkApiRouter };