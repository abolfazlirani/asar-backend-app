import { Router } from "express";
import { articleBookmarkController } from "../../http/controllers/articleBookmark.controller.js";
import { authorizeAdmin, authorizeRequest } from "../../http/middlewares/auth.middleware.js";

const articleBookmarkAdminRouter = Router();

articleBookmarkAdminRouter.use(authorizeRequest, authorizeAdmin);

articleBookmarkAdminRouter.route("/")
    .get(articleBookmarkController.getAllBookmarksAdmin);

export { articleBookmarkAdminRouter };