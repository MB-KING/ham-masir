import { MediaProvider } from "@prisma/client";
import {
  fetchTelegramFileBytes,
  uploadPhotoToTelegramStorage
} from "@/lib/media/telegram-media";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/shared/errors";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export class MediaService {
  async createFromUpload(input: {
    uploaderId: string;
    buffer: Buffer;
    filename: string;
    mimeType: string;
  }) {
    if (!ALLOWED_MIME.has(input.mimeType)) {
      throw new AppError("VALIDATION_ERROR", "Unsupported image type");
    }
    if (input.buffer.byteLength > MAX_UPLOAD_BYTES) {
      throw new AppError("VALIDATION_ERROR", "Image too large (max 5MB)");
    }

    const storageChat = process.env.TELEGRAM_STORAGE_CHAT_ID;
    if (storageChat) {
      const uploaded = await uploadPhotoToTelegramStorage({
        buffer: input.buffer,
        filename: input.filename,
        contentType: input.mimeType
      });
      return prisma.mediaAsset.create({
        data: {
          provider: MediaProvider.TELEGRAM,
          telegramFileId: uploaded.fileId,
          telegramFileUniqueId: uploaded.fileUniqueId,
          mimeType: uploaded.mimeType,
          width: uploaded.width,
          height: uploaded.height,
          uploaderId: input.uploaderId
        }
      });
    }

    // Dev / fallback: data URL stored as URL provider (not for large prod use)
    const dataUrl = `data:${input.mimeType};base64,${input.buffer.toString("base64")}`;
    return prisma.mediaAsset.create({
      data: {
        provider: MediaProvider.URL,
        url: dataUrl,
        mimeType: input.mimeType,
        uploaderId: input.uploaderId
      }
    });
  }

  async getStreamable(mediaId: string) {
    const asset = await prisma.mediaAsset.findUnique({ where: { id: mediaId } });
    if (!asset) {
      throw new AppError("NOT_FOUND", "Media not found");
    }

    if (asset.provider === MediaProvider.URL && asset.url) {
      if (asset.url.startsWith("data:")) {
        const match = /^data:([^;]+);base64,(.+)$/.exec(asset.url);
        if (!match) throw new AppError("NOT_FOUND", "Invalid media");
        return {
          buffer: Buffer.from(match[2], "base64"),
          contentType: match[1]
        };
      }
      const response = await fetch(asset.url, { cache: "no-store" });
      if (!response.ok) throw new AppError("NOT_FOUND", "Media unavailable");
      return {
        buffer: Buffer.from(await response.arrayBuffer()),
        contentType:
          response.headers.get("content-type") ??
          asset.mimeType ??
          "application/octet-stream"
      };
    }

    if (!asset.telegramFileId) {
      throw new AppError("NOT_FOUND", "Media unavailable");
    }

    const file = await fetchTelegramFileBytes(asset.telegramFileId);
    return {
      buffer: file.buffer,
      contentType: asset.mimeType ?? file.contentType
    };
  }
}

export function mediaPublicPath(mediaId: string) {
  return `/api/media/${mediaId}`;
}
