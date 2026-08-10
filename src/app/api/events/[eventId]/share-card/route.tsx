import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { publicEventStatuses } from "@/modules/events/event.repository";
import { mediaPublicPath } from "@/modules/media/media.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sizes = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  landscape: { width: 1200, height: 630 }
} as const;

const dateFormatter = new Intl.DateTimeFormat("fa-IR", {
  weekday: "long",
  month: "long",
  day: "numeric"
});
const timeFormatter = new Intl.DateTimeFormat("fa-IR", {
  hour: "2-digit",
  minute: "2-digit"
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const formatParam = new URL(request.url).searchParams.get("format") ?? "square";
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

  const cover = event.images[0]
    ? mediaPublicPath(event.images[0].mediaAssetId)
    : null;
  const origin = new URL(request.url).origin;
  const coverUrl = cover ? `${origin}${cover}` : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: coverUrl
            ? `linear-gradient(180deg, rgba(6,17,36,0.35), rgba(6,17,36,0.92)), url(${coverUrl})`
            : "linear-gradient(160deg, #0B1E43 0%, #061124 55%, #050A14 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "white",
          padding: 64,
          fontFamily: "sans-serif",
          direction: "rtl"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 28, color: "#F59E0B", fontWeight: 800 }}>
            هم مسیر · برنامه {event.eventNumber}
          </div>
          <div style={{ fontSize: format === "landscape" ? 54 : 64, fontWeight: 900, lineHeight: 1.2 }}>
            {event.title}
          </div>
          <div style={{ fontSize: 28, color: "#E2E8F0" }}>
            {dateFormatter.format(event.date)} · {timeFormatter.format(event.meetingTime)}
          </div>
          <div style={{ fontSize: 26, color: "#CBD5E1" }}>{event.locationName}</div>
          {event.description ? (
            <div style={{ fontSize: 24, color: "#94A3B8", maxWidth: 900 }}>
              {event.description.slice(0, 120)}
            </div>
          ) : null}
          <div style={{ fontSize: 24, color: "#FBBF24", fontWeight: 700 }}>
            {event._count.registrations.toLocaleString("fa-IR")} همراه
          </div>
        </div>
      </div>
    ),
    size
  );
}
