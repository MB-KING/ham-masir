import { NextResponse } from "next/server";
import { MediaService } from "@/modules/media/media.service";
import { AppError } from "@/shared/errors";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  const { mediaId } = await params;
  try {
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
