import { Router } from "express";
import { articleController } from "../../http/controllers/article.controller.js";
import multer from "multer";
import { authorizeAdmin, authorizeRequest } from "../../http/middlewares/auth.middleware.js";

const articleApiRouter = Router();

articleApiRouter.route("/new")
    .get(articleController.getNewArticles);

articleApiRouter.route("/")
    .get(articleController.getAllArticles);

articleApiRouter.route("/search")
    .get(articleController.searchArticles);

articleApiRouter.route("/:id")
    .get(authorizeRequest, articleController.getSingleArticle);

articleApiRouter.route("/:id/share")
    .post(multer().none(), articleController.incrementShare);

export { articleApiRouter };