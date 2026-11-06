import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname || "") || ".jpg";
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif|bmp|heic/i;
  const ext = path.extname(file.originalname || "").toLowerCase();
  const isAllowedExt = allowed.test(ext);
  const isAllowedMime =
    allowed.test(file.mimetype || "") ||
    (file.mimetype && file.mimetype.startsWith("image/"));

  if (
    isAllowedExt ||
    isAllowedMime ||
    !file.mimetype ||
    file.mimetype === "application/octet-stream"
  ) {
    return cb(null, true);
  }
  cb(new Error("Hanya file gambar yang diizinkan (jpeg, jpg, png, webp)"));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

export default upload;
