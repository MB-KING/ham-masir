import { ModerationStatus, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasAnyRole } from "@/modules/auth/authorization";
import { getOptionalCurrentUser } from "@/modules/auth/session";
import { MediaService } from "@/modules/media/media.service";
import { AppError } from "@/shared/errors";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  const { mediaId } = await params;
  try {
    const photo = await prisma.eventPhoto.findFirst({
      where: { mediaAssetId: mediaId },
      select: { userId: true, status: true }
    });

    if (photo && photo.status !== ModerationStatus.APPROVED) {
      const user = await getOptionalCurrentUser();
      const isOwner = user?.id === photo.userId;
      const isAdmin = user
        ? hasAnyRole(user, [Role.ADMIN, Role.SUPER_ADMIN])
        : false;
      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      }
    }

    const { buffer, contentType } = await new MediaService().getStreamable(
      mediaId
    );
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=300"
      }
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.code }, { status: 404 });
    }
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
