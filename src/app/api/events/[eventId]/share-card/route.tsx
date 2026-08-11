import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  faTehranDateShortFormatter,
  faTehranTimeFormatter
} from "@/lib/tehran-time";
import { publicEventStatuses } from "@/modules/events/event.repository";
import { MediaService } from "@/modules/media/media.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sizes = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  landscape: { width: 1200, height: 630 }
} as const;

const dateFormatter = faTehranDateShortFormatter;
const timeFormatter = faTehranTimeFormatter;

async function loadVazirmatnFont() {
  const sources = [
    "https://cdn.jsdelivr.net/fontsource/fonts/vazirmatn@latest/arabic-700-normal.woff",
    "https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Bold.woff"
  ];

  for (const url of sources) {
    try {
      const response = await fetch(url, { cache: "force-cache" });
      if (!response.ok) continue;
      const data = await response.arrayBuffer();
      if (data.byteLength > 0 && data.byteLength < 400_000) return data;
    } catch {
      // try next source
    }
  }
  return null;
}

async function toShareCoverDataUrl(buffer: Buffer, contentType: string) {
  try {
    const sharp = (await import("sharp")).default;
    const resized = await sharp(buffer)
      .rotate()
      .resize({
        width: 1080,
        height: 1920,
        fit: "cover",
        withoutEnlargement: true
      })
      .jpeg({ quality: 72, mozjpeg: true })
      .toBuffer();
    return `data:image/jpeg;base64,${resized.toString("base64")}`;
  } catch (error) {
    logger.warn("share_card_cover_resize_failed", {
      reason: error instanceof Error ? error.message : "unknown"
    });
    // Satori supports jpeg/png; skip webp/gif if sharp unavailable.
    const ok =
      contentType.includes("jpeg") ||
      contentType.includes("jpg") ||
      contentType.includes("png");
    if (!ok || buffer.byteLength > 220_000) return null;
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const formatParam =
      new URL(request.url).searchParams.get("format") ?? "square";
    const format =
      formatParam in sizes
        ? (formatParam as keyof typeof sizes)
        : "square";
    const size = sizes[format];

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        deletedAt: null,
        status: { in: publicEventStatuses }
      },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1,
          include: { mediaAsset: true }
        },
        _count: {
          select: { registrations: { where: { status: "REGISTERED" } } }
        }
      }
    });

    if (!event) {
      return new Response("Not found", { status: 404 });
    }

    let coverDataUrl: string | null = null;
    if (event.images[0]?.mediaAssetId) {
      try {
        const media = await new MediaService().getStreamable(
          event.images[0].mediaAssetId
        );
        coverDataUrl = await toShareCoverDataUrl(
          media.buffer,
          media.contentType
        );
      } catch (error) {
        logger.warn("share_card_cover_failed", {
          eventId,
          reason: error instanceof Error ? error.message : "unknown"
        });
      }
    }

    const fontData = await loadVazirmatnFont();
    const titleSize = format === "landscape" ? 52 : 60;
    const pad = format === "story" ? 72 : 56;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            position: "relative",
            background: "#061124",
            color: "white",
            padding: pad,
            fontFamily: fontData ? "Vazirmatn" : "sans-serif"
          }}
        >
          {coverDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverDataUrl}
              alt=""
              width={size.width}
              height={size.height}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />
          ) : null}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(180deg, rgba(6,17,36,0.25) 0%, rgba(6,17,36,0.88) 55%, rgba(6,17,36,0.96) 100%)",
              display: "flex"
            }}
          />
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              width: "100%",
              alignItems: "flex-end"
            }}
          >
            <div
              style={{
                fontSize: 26,
                color: "#F59E0B",
                fontWeight: 700,
                textAlign: "right",
                width: "100%"
              }}
            >
              {`هم مسیر · برنامه ${event.eventNumber}`}
            </div>
            <div
              style={{
                fontSize: titleSize,
                fontWeight: 700,
                lineHeight: 1.25,
                textAlign: "right",
                width: "100%"
              }}
            >
              {event.title}
            </div>
            <div
              style={{
                fontSize: 26,
                color: "#E2E8F0",
                textAlign: "right",
                width: "100%"
              }}
            >
              {`${dateFormatter.format(event.date)} · ${timeFormatter.format(event.meetingTime)}`}
            </div>
            <div
              style={{
                fontSize: 24,
                color: "#CBD5E1",
                textAlign: "right",
                width: "100%"
              }}
            >
              {event.locationName}
            </div>
            {event.description ? (
              <div
                style={{
                  fontSize: 22,
                  color: "#94A3B8",
                  textAlign: "right",
                  width: "100%"
                }}
              >
                {event.description.slice(0, 120)}
              </div>
            ) : null}
            <div
              style={{
                fontSize: 24,
                color: "#FBBF24",
                fontWeight: 700,
                textAlign: "right",
                width: "100%"
              }}
            >
              {`${event._count.registrations.toLocaleString("fa-IR")} همراه`}
            </div>
          </div>
        </div>
      ),
      {
        ...size,
        fonts: fontData
          ? [
              {
                name: "Vazirmatn",
                data: fontData,
                style: "normal",
                weight: 700
              }
            ]
          : undefined
      }
    );
  } catch (error) {
    logger.warn("share_card_failed", {
      reason: error instanceof Error ? error.message : "unknown"
    });
    return new Response(
      error instanceof Error ? error.message : "Share card failed",
      { status: 500 }
    );
  }
}
