import { Router } from "express";
import { upload } from "../../utils/multer.config.js";
import { postCategoryController } from "../../http/controllers/postCategory.controller.js";
import { authorizeAdmin, authorizeRequest } from "../../http/middlewares/auth.middleware.js";

const postCategoryAdminRouter = Router();

postCategoryAdminRouter.use(authorizeRequest, authorizeAdmin);

postCategoryAdminRouter.route("/all")
    .get(postCategoryController.getAllCategoriesAdmin);

postCategoryAdminRouter.route("/")
    .post(
        upload.single("image"),
        postCategoryController.createCategory
    )
    .get(postCategoryController.getCategories);

postCategoryAdminRouter.route("/:id")
    .put(
        upload.single("image"),
        postCategoryController.updateCategory
    )
    .delete(postCategoryController.deleteCategory);

export { postCategoryAdminRouter };