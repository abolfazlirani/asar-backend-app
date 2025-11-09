import { Router } from "express";
import { authController } from "../../http/controllers/auth.controller.js";
import multer from "multer";
import { authenticateUserValidator } from "../../http/validations/auth/authenticate.validator.js";
import { confirmCodeValidator } from "../../http/validations/auth/confirmCode.validator.js";
import { validateRequest } from "../../http/middlewares/validation.middleware.js";

const authRouter = Router();

authRouter.route("/send-otp").post(
    multer().none(),
    authenticateUserValidator(),
    validateRequest,
    authController.authenticateUser
);

authRouter.route("/confirm-code").post(
    multer().none(),
    confirmCodeValidator(),
    validateRequest,
    authController.confirmCode
);

export { authRouter };
