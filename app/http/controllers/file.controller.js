import {getFileAddress} from "../../utils/multer.config.js";

class FileController {
    async publicUpload(req , res , next) {
        try {
            const fileAddr = getFileAddress(req);
            return res.status(201).json({
                message: "information updated",
                result: {
                    fileAddr
                },
            });
        } catch (err) {
            next(e);
        }
    }
}

export const fileController = new FileController()