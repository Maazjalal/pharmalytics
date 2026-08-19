import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { InvalidFileTypeError } from "./uploads.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const TEMPLATES_DIR = path.join(__dirname, "../../templates");
export const TEMPLATE_PATH = path.join(TEMPLATES_DIR, "current.docx");

fs.mkdirSync(TEMPLATES_DIR, { recursive: true });

const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const uploadTemplate = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== DOCX_MIME_TYPE) {
      cb(new InvalidFileTypeError("Only .docx files are allowed"));
      return;
    }
    cb(null, true);
  },
});
