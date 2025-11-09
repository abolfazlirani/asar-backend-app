import { Router } from "express";
import {userRouter} from "../api/user.router.js";
import {remoteConfigAdminRouter} from "./remote_config.router.js";
import {remoteConfigController} from "../../http/controllers/remote.config.controller.js";

const adminRouter = Router();

adminRouter.use(userRouter);
adminRouter.use("/remote_config/logs",remoteConfigController.getAllRemoteConfigs,);

export {
    adminRouter
}
