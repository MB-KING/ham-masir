import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  faTehranDateShortFormatter,
  faTehranTimeFormatter
} from "@/lib/tehran-time";
import { publicEventStatuses } from "@/modules/events/event.repository";
import { MediaService } from "@/modules/media/media.service";
import { getDisplayName } from "@/shared/privacy";
import {
  shareCardFormats,
  type ShareCardFormat
} from "@/shared/share";
import { AppError } from "@/shared/errors";

export const shareCardSizes = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  landscape: { width: 1200, height: 630 }
} as const;

const dateFormatter = faTehranDateShortFormatter;
const timeFormatter = faTehranTimeFormatter;

const UUID_RE = /^[0-9a-f-]{36}$/i;

export function parseShareCardFormat(
  value: string | null | undefined
): ShareCardFormat {
  if (value && (shareCardFormats as readonly string[]).includes(value)) {
    return value as ShareCardFormat;
  }
  return "square";
}

export function parseShareCardUserId(value: string | null | undefined) {
  const id = value?.trim() ?? "";
  return UUID_RE.test(id) ? id : null;
}

/** Satori ignores CSS direction; RLE+PDF keeps Persian shaping and bidi. */
export function rtlText(value: string) {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return "";
  return `\u200F\u202B${text}\u202C`;
}

function shorten(text: string, max: number) {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

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

async function toJpegDataUrl(
  buffer: Buffer,
  contentType: string,
  size: { width: number; height: number }
) {
  try {
    const sharp = (await import("sharp")).default;
    const resized = await sharp(buffer)
      .rotate()
      .resize({
        width: size.width,
        height: size.height,
        fit: "cover",
        withoutEnlargement: true
      })
      .jpeg({ quality: 72, mozjpeg: true })
      .toBuffer();
    return `data:image/jpeg;base64,${resized.toString("base64")}`;
  } catch (error) {
    logger.warn("share_card_image_resize_failed", {
      reason: error instanceof Error ? error.message : "unknown"
    });
    const ok =
      contentType.includes("jpeg") ||
      contentType.includes("jpg") ||
      contentType.includes("png");
    if (!ok || buffer.byteLength > 220_000) return null;
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  }
}

async function toAvatarDataUrl(photoUrl: string) {
  if (!/^https:\/\//i.test(photoUrl)) return null;
  try {
    const response = await fetch(photoUrl, {
      cache: "force-cache",
      signal: AbortSignal.timeout(4000)
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength < 32 || buffer.byteLength > 2_000_000) return null;
    return toJpegDataUrl(buffer, contentType, { width: 192, height: 192 });
  } catch (error) {
    logger.warn("share_card_avatar_failed", {
      reason: error instanceof Error ? error.message : "unknown"
    });
    return null;
  }
}

type Sharer = {
  displayName: string;
  avatarDataUrl: string | null;
  initial: string;
};

async function loadSharer(userId: string | null): Promise<Sharer | null> {
  if (!userId) return null;
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      firstName: true,
      lastName: true,
      username: true,
      photoUrl: true
    }
  });
  if (!user) return null;
  const displayName = getDisplayName(user);
  const initial = displayName.trim().charAt(0) || "ه";
  const avatarDataUrl = user.photoUrl
    ? await toAvatarDataUrl(user.photoUrl)
    : null;
  return { displayName, avatarDataUrl, initial };
}

function RtlLine({
  text,
  fontSize,
  color,
  fontWeight = 700
}: {
  text: string;
  fontSize: number;
  color: string;
  fontWeight?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        justifyContent: "flex-end"
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "flex-end",
          flexWrap: "wrap",
          fontSize,
          color,
          fontWeight,
          lineHeight: 1.35
        }}
      >
        {rtlText(text)}
      </div>
    </div>
  );
}

function AvatarBadge({
  sharer,
  size
}: {
  sharer: Sharer;
  size: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        border: "4px solid #F59E0B",
        backgroundColor: "#F59E0B",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }}
    >
      {sharer.avatarDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={sharer.avatarDataUrl}
          alt=""
          width={size}
          height={size}
          style={{
            width: size,
            height: size,
            objectFit: "cover"
          }}
        />
      ) : (
        <div
          style={{
            display: "flex",
            fontSize: Math.round(size * 0.42),
            color: "#061124",
            fontWeight: 700
          }}
        >
          {rtlText(sharer.initial)}
        </div>
      )}
    </div>
  );
}

export type RenderShareCardInput = {
  eventId: string;
  format: ShareCardFormat;
  userId?: string | null;
};

export async function renderShareCard(input: RenderShareCardInput) {
  const format = parseShareCardFormat(input.format);
  const size = shareCardSizes[format];
  const userId = parseShareCardUserId(input.userId ?? null);

  const event = await prisma.event.findFirst({
    where: {
      id: input.eventId,
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
    throw new AppError("EVENT_NOT_FOUND", "این برنامه پیدا نشد.", 404);
  }

  let coverDataUrl: string | null = null;
  if (event.images[0]?.mediaAssetId) {
    try {
      const media = await new MediaService().getStreamable(
        event.images[0].mediaAssetId
      );
      coverDataUrl = await toJpegDataUrl(media.buffer, media.contentType, {
        width: 1080,
        height: 1920
      });
    } catch (error) {
      logger.warn("share_card_cover_failed", {
        eventId: input.eventId,
        reason: error instanceof Error ? error.message : "unknown"
      });
    }
  }

  const sharer = await loadSharer(userId);
  const fontData = await loadVazirmatnFont();
  const titleSize = format === "landscape" ? 42 : format === "story" ? 60 : 54;
  const pad = format === "story" ? 72 : format === "landscape" ? 44 : 56;
  const avatarSize = format === "landscape" ? 72 : format === "story" ? 104 : 88;
  const metaSize = format === "landscape" ? 22 : 26;
  const titleMax = format === "landscape" ? 70 : 100;
  const descMax = format === "landscape" ? 70 : 110;
  const dateLine = `${dateFormatter.format(event.date)} · ${timeFormatter.format(event.meetingTime)}`;
  const countLine = `${event._count.registrations.toLocaleString("fa-IR")} همراه`;
  const brandLine = `هم مسیر · برنامه ${event.eventNumber.toLocaleString("fa-IR")}`;
  const description =
    format === "landscape"
      ? null
      : event.description
        ? shorten(event.description, descMax)
        : null;

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
            alignItems: "flex-end",
            gap: format === "landscape" ? 10 : 14,
            width: "100%"
          }}
        >
          {sharer ? (
            <div
              style={{
                display: "flex",
                width: "100%",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 16
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 4,
                  flexGrow: 1
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "flex-end",
                    fontSize: format === "landscape" ? 26 : 32,
                    fontWeight: 700,
                    color: "#FFFFFF"
                  }}
                >
                  {rtlText(sharer.displayName)}
                </div>
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "flex-end",
                    fontSize: format === "landscape" ? 18 : 22,
                    fontWeight: 700,
                    color: "#FDE68A"
                  }}
                >
                  {rtlText("من در این برنامه هستم")}
                </div>
              </div>
              <AvatarBadge sharer={sharer} size={avatarSize} />
            </div>
          ) : null}
          <RtlLine text={brandLine} fontSize={metaSize} color="#F59E0B" />
          <RtlLine
            text={shorten(event.title, titleMax)}
            fontSize={titleSize}
            color="#FFFFFF"
          />
          <RtlLine text={dateLine} fontSize={metaSize} color="#E2E8F0" />
          <RtlLine
            text={event.locationName}
            fontSize={format === "landscape" ? 20 : 24}
            color="#CBD5E1"
          />
          {description ? (
            <RtlLine text={description} fontSize={20} color="#94A3B8" />
          ) : null}
          <RtlLine text={countLine} fontSize={metaSize} color="#FBBF24" />
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
}

export async function renderShareCardPng(input: RenderShareCardInput) {
  const format = parseShareCardFormat(input.format);
  const size = shareCardSizes[format];
  const image = await renderShareCard({ ...input, format });
  return {
    buffer: Buffer.from(await image.arrayBuffer()),
    width: size.width,
    height: size.height,
    contentType: "image/png" as const
  };
}

export async function renderShareCardJpeg(input: RenderShareCardInput) {
  const png = await renderShareCardPng(input);
  try {
    const sharp = (await import("sharp")).default;
    const buffer = await sharp(png.buffer)
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer();
    return {
      buffer,
      width: png.width,
      height: png.height,
      contentType: "image/jpeg" as const
    };
  } catch (error) {
    logger.warn("share_card_jpeg_failed", {
      reason: error instanceof Error ? error.message : "unknown"
    });
    return png;
  }
}
