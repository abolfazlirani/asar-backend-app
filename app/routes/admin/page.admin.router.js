import { Router } from "express";
import { pageController } from "../../http/controllers/page.controller.js";
import multer from "multer";

const pageAdminRouter = Router();

pageAdminRouter.route("/")
    .get(pageController.getAllPages)
    .post(multer().none(), pageController.createPage);

pageAdminRouter.route("/:id")
    .get(pageController.getPageById)
    .put(multer().none(), pageController.updatePage)
    .delete(pageController.deletePage);

export { pageAdminRouter };