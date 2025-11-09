import {Router} from "express"
import {remoteConfigController} from "../../http/controllers/remote.config.controller.js"
import {authorizeAdmin, authorizeRequest} from "../../http/middlewares/auth.middleware.js";

const remoteConfigAdminRouter = Router()

remoteConfigAdminRouter
    .route("/logs")
    .get(authorizeRequest, authorizeAdmin, remoteConfigController.getAllRemoteConfigs)

export {remoteConfigAdminRouter}
