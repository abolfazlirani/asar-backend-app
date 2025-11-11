import { Router } from "express";
import { postCategoryController } from "../../http/controllers/postCategory.controller.js";

const postCategoryApiRouter = Router();

postCategoryApiRouter.route("/")
    .get(postCategoryController.getCategories);

export { postCategoryApiRouter };