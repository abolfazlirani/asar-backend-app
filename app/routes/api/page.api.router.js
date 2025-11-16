import { Router } from "express";
import { pageController } from "../../http/controllers/page.controller.js";

const pageApiRouter = Router();

pageApiRouter.route("/:slug")
    .get(pageController.getPageBySlug);

export { pageApiRouter };