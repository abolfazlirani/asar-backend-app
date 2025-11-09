import { Router } from "express";
import multer from "multer";
import { remoteConfigController } from "../../http/controllers/remote.config.controller.js";
import {authorizeRequest} from "../../http/middlewares/auth.middleware.js";

const remoteConfigRouter = Router();

remoteConfigRouter.route("/splash").post(
    authorizeRequest,
    multer().none(),
    remoteConfigController.splash
);

export { remoteConfigRouter };
