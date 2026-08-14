import { NextResponse } from "next/server";
import { EventPhotoService } from "@/modules/events/event-photo.service";
import { requireCurrentUser } from "@/modules/auth/session";
import { AppError } from "@/shared/errors";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const user = await requireCurrentUser();
    const { eventId } = await params;
    const form = await request.formData();
    const captionRaw = form.get("caption");
    const caption =
      typeof captionRaw === "string" ? captionRaw.trim().slice(0, 200) : "";
    const file = form.get("image");

    if (!(file instanceof Blob) || file.size === 0) {
      throw new AppError("VALIDATION_ERROR", "تصویر معتبر نیست.");
    }

    const filename =
      file instanceof File && file.name ? file.name : "event-photo.jpg";
    const mimeType =
      (file instanceof File && file.type) || file.type || "image/jpeg";
    const buffer = Buffer.from(await file.arrayBuffer());

    const photo = await new EventPhotoService().upload({
      userId: user.id,
      eventId,
      buffer,
      filename,
      mimeType,
      caption
    });

    return NextResponse.json({ ok: true, photoId: photo.id });
  } catch (error) {
    const message =
      error instanceof AppError
        ? error.message
        : error instanceof Error
          ? error.message
          : "آپلود ناموفق بود.";
    logger.warn("event_photo_upload_failed", { reason: message });
    const status = error instanceof AppError ? error.status : 500;
    const code = error instanceof AppError ? error.code : "UNEXPECTED_ERROR";
    return NextResponse.json({ ok: false, error: message, code }, { status });
  }
}
