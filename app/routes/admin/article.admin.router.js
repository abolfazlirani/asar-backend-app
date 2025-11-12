import { Router } from "express";
import { upload } from "../../utils/multer.config.js";
import { articleController } from "../../http/controllers/article.controller.js";
import { authorizeAdmin, authorizeRequest } from "../../http/middlewares/auth.middleware.js";

const articleAdminRouter = Router();

articleAdminRouter.use(authorizeRequest, authorizeAdmin);

const uploadFields = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'source', maxCount: 1 }
]);

articleAdminRouter.route("/")
    .post(
        uploadFields,
        articleController.createArticle
    )
    .get(articleController.getAllArticles);

articleAdminRouter.route("/:id")
    .get(articleController.getSingleArticle)
    .put(
        uploadFields,
        articleController.updateArticle
    )
    .delete(articleController.deleteArticle);

export { articleAdminRouter };