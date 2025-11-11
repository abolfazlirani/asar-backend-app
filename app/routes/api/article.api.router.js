import { Router } from "express";
import { articleController } from "../../http/controllers/article.controller.js";
import multer from "multer";

const articleApiRouter = Router();

articleApiRouter.route("/")
    .get(articleController.getAllArticles);

articleApiRouter.route("/:id")
    .get(articleController.getSingleArticle);

articleApiRouter.route("/:id/share")
    .post(multer().none(), articleController.incrementShare);

export { articleApiRouter };