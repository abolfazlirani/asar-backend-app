import path, { join } from "path";
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";

// لیست نوع فایل‌های مجاز
const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",

    "audio/mpeg", // mp3
    "audio/wav", // wav
    "audio/ogg", // ogg
    "audio/aac", // aac

    "video/mp4", // mp4
    "video/quicktime", // mov
    "video/x-msvideo", // avi
    "video/webm", // webm

];
let upload;
let memoryStorage = multer.memoryStorage();
let inMemoryUpload = multer({ storage: memoryStorage });

// وضعیت آپلود: local یا s3 (لیارا)
if (process.env.UPLOAD_STATE === "local") {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join("public", "uploads", file.fieldname);
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const timestamp = Date.now();
      const sanitized = file.originalname.replace(/\s+/g, "_");
      cb(null, `${file.fieldname}-${timestamp}-${sanitized}`);
    },
  });

  upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("فرمت فایل مجاز نیست"));
      }
    },
  });

} else {
  const s3 = new S3Client({
    endpoint: process.env.LIARA_ENDPOINT,
    credentials: {
      accessKeyId: process.env.LIARA_ACCESS_KEY,
      secretAccessKey: process.env.LIARA_SECRET_KEY,
    },
    region: "default",
  });

  upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.LIARA_BUCKET_NAME,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      acl: "public-read",
      key: function (req, file, cb) {
        const timestamp = Date.now();
        const sanitized = file.originalname.replace(/\s+/g, "_");
        const filePath = join(`${file.fieldname}/`, `${file.fieldname}-${timestamp}-${sanitized}`);
        cb(null, filePath);
      },
    }),
    fileFilter: function (req, file, cb) {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("فرمت فایل مجاز نیست"));
      }
    },
  });
}

// 📦 دریافت مسیر فایل آپلودشده
function getFileAddress(req) {
  if (req.files) {
    const keys = Object.keys(req.files);
    const paths = {};
    keys.forEach((key) => {
      paths[key] = process.env.UPLOAD_STATE === "local"
          ? req.files[key][0].path
          : req.files[key][0].location;
    });
    return paths;
  }

  if (req.file) {
    return process.env.UPLOAD_STATE === "local"
        ? req.file.path
        : req.file.location;
  }

  return null;
}

export { upload, getFileAddress, inMemoryUpload };
