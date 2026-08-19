import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOADS_DIR = path.join(__dirname, "../../uploads");

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export function attachmentPath(clientId: string): string {
  return path.join(UPLOADS_DIR, `${clientId}.pdf`);
}

export class InvalidFileTypeError extends Error {}

export const uploadAttachment = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new InvalidFileTypeError("Only PDF files are allowed"));
      return;
    }
    cb(null, true);
  },
});
