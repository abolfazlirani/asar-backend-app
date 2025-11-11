import { Router } from "express";
import { upload } from "../../utils/multer.config.js";
import { articleController } from "../../http/controllers/article.controller.js";
import { authorizeAdmin, authorizeRequest } from "../../http/middlewares/auth.middleware.js";

const articleAdminRouter = Router();

articleAdminRouter.use(authorizeRequest, authorizeAdmin);

articleAdminRouter.route("/")
    .post(
        upload.single("image"),
        articleController.createArticle
    )
    .get(articleController.getAllArticles);

articleAdminRouter.route("/:id")
    .get(articleController.getSingleArticle)
    .put(
        upload.single("image"),
        articleController.updateArticle
    )
    .delete(articleController.deleteArticle);

export { articleAdminRouter };