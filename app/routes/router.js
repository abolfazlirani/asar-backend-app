import { Router } from "express";
import { authRouter } from "./api/auth.router.js";
import {adminRouter} from "./admin/admin.router.js";
import {remoteConfigRouter} from "./api/remote.config.router.js";

const mainRouter = Router();

mainRouter.use('/auth', authRouter);
mainRouter.use('/remote_config', remoteConfigRouter);
mainRouter.use('/admin', adminRouter);

export {
    mainRouter
}
