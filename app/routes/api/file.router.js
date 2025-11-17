import { Router } from "express";
import {validateRequest} from "../../http/middlewares/validation.middleware.js";
import {fileController} from "../../http/controllers/file.controller.js";
import {authorizeRequest} from "../../http/middlewares/auth.middleware.js";
import {upload} from "../../utils/multer.config.js";
import {validateUploadedFile} from "../../http/validations/auth/validateFile.validator.js";

const fileRouter = Router();

fileRouter
    .route('/')
    .post(
        upload.single('file'),
        validateUploadedFile,
         authorizeRequest,
        validateRequest,
        fileController.publicUpload
    )

export default fileRouter