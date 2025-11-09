import { Router } from "express";
import multer from "multer";
import { userController } from "../../http/controllers/user.controller.js";
import { authorizeRequest, authorizeAdmin } from "../../http/middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.post(
    "/users",
    multer().none(),
    authorizeRequest,
    authorizeAdmin,
    userController.createUser
);

userRouter.get(
    "/users",
    authorizeRequest,
    authorizeAdmin,
    userController.getAllUsers
);

userRouter.put(
    "/users/:id",
    multer().none(),
    authorizeRequest,
    authorizeAdmin,
    userController.updateUser
);

userRouter.delete(
    "/users/:id",
    authorizeRequest,
    authorizeAdmin,
    userController.deleteUser
);

export { userRouter };
