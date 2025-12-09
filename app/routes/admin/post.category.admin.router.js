import { Router } from "express";
import { upload } from "../../utils/multer.config.js";
import { postCategoryController } from "../../http/controllers/postCategory.controller.js";
import { authorizeAdmin, authorizeAdminOrEditor, authorizeRequest } from "../../http/middlewares/auth.middleware.js";

const postCategoryAdminRouter = Router();

// GET endpoints - accessible by both admin and editor
postCategoryAdminRouter.route("/all")
    .get(authorizeRequest, authorizeAdminOrEditor, postCategoryController.getAllCategoriesAdmin);

postCategoryAdminRouter.route("/")
    .get(authorizeRequest, authorizeAdminOrEditor, postCategoryController.getCategories)
    .post(
        authorizeRequest,
        authorizeAdmin,
        upload.single("image"),
        postCategoryController.createCategory
    );

postCategoryAdminRouter.route("/:id")
    .put(
        authorizeRequest,
        authorizeAdmin,
        upload.single("image"),
        postCategoryController.updateCategory
    )
    .delete(
        authorizeRequest,
        authorizeAdmin,
        postCategoryController.deleteCategory
    );

export { postCategoryAdminRouter };