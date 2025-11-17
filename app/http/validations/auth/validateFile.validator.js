import { validateBufferMIMEType, validateMIMEType } from "validate-image-type";

export async function validateUploadedFile(req, res, next) {
  try {
    const isCreation = req.method === "POST";

    // Check if file is required
    if (isCreation && !req.file) {
      return next({
        status: 400,
        message: "File is required for upload",
      });
    }

    // if (req.header('X-Public-Upload') !== process.env.PUBLIC_UPLOAD_KEY) {
    //   return next({
    //     status: 403,
    //     message: "Invalid request and key",
    //   });
    // }

    // If a file is provided, validate its MIME type
    if (req.file) {
      if(process.env.UPLOAD_STATE==='liara') {
        return next()
      }
      const validationResult = await validateMIMEType(req.file.path, {
        originalFilename: req.file.originalname,
        allowMimeTypes: ["image/jpeg", "image/png", "image/jpg","image/gif","video/mp4","audio/mpeg","application/pdf","application/vnd.ms-powerpoint"],
      });

      if (!validationResult.ok) {
        return next({
          status: 400,
          message: "File type not supported",
        });
      }
    }

    // Proceed to the next middleware
    next();
  } catch (e) {
    // Handle any unexpected errors
    next(e);
  }
}
