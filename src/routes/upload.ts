import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { authenticate, authorize } from "../middleware/auth.js";

export const uploadRoutes = Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype.split("/")[1]);
    if (ext || mime) {
      cb(null, true);
    } else {
      cb(new Error("Зөвхөн зураг файл upload хийх боломжтой"));
    }
  },
});

uploadRoutes.post(
  "/image",
  authenticate,
  authorize("editor"),
  upload.single("image"),
  (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: "Зураг сонгоогүй байна" });
      return;
    }

    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename });
  }
);
