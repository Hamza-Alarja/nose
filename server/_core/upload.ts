import express from "express";
import multer, { MulterError } from "multer";
import { storagePut } from "../storage.js";
import crypto from "node:crypto";
import { verifyAdminSession } from "./adminGuard.js";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;

function hasValidSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "image/jpeg") {
    return (
      buffer.length >= 3 &&
      buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
    );
  }
  if (mimeType === "image/png") {
    return buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  }
  if (mimeType === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }
  if (mimeType === "image/avif") {
    return (
      buffer.length >= 12 &&
      buffer.toString("ascii", 4, 8) === "ftyp" &&
      /avif|avis/.test(buffer.toString("ascii", 8, 16))
    );
  }
  return false;
}

function hasMatchingExtension(filename: string, mimeType: string): boolean {
  const extension = filename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return extension === IMAGE_TYPES[mimeType as keyof typeof IMAGE_TYPES];
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!(file.mimetype in IMAGE_TYPES)) {
      return callback(new MulterError("LIMIT_UNEXPECTED_FILE", "file"));
    }
    callback(null, true);
  },
});

function sendUploadError(res: express.Response, status: number, error: string) {
  return res.status(status).json({ error, message: error });
}

export function registerUploadRoutes(app: express.Express) {
  app.post(
    "/api/upload",
    async (req, res, next) => {
      if (!(await verifyAdminSession(req))) {
        return sendUploadError(res, 403, "upload_admin_required");
      }
      return next();
    },
    (req, res, next) => {
      upload.single("file")(req, res, error => {
        if (error instanceof MulterError) {
          if (error.code === "LIMIT_FILE_SIZE") {
            return sendUploadError(res, 413, "upload_file_too_large");
          }
          return sendUploadError(res, 400, "upload_invalid_file");
        }
        if (error) return sendUploadError(res, 400, "upload_malformed_request");
        next();
      });
    },
    async (req: express.Request, res: express.Response) => {
      try {
        const file = req.file;
        if (!file) return sendUploadError(res, 400, "upload_file_missing");

        const extension =
          IMAGE_TYPES[file.mimetype as keyof typeof IMAGE_TYPES];
        if (
          !extension ||
          !hasMatchingExtension(file.originalname, file.mimetype) ||
          !hasValidSignature(file.buffer, file.mimetype)
        ) {
          return sendUploadError(res, 400, "upload_invalid_image");
        }

        const filename = `products/${crypto.randomUUID()}.${extension}`;
        const result = await storagePut(filename, file.buffer, file.mimetype);
        try {
          const publicUrl = new URL(result.url);
          if (!/^https?:$/.test(publicUrl.protocol))
            throw new Error("invalid url");
        } catch {
          return sendUploadError(res, 502, "upload_invalid_storage_url");
        }

        return res.status(200).json({ url: result.url });
      } catch {
        return sendUploadError(res, 502, "upload_storage_failed");
      }
    }
  );
}
