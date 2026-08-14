"use client";

import { Download, Loader2, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/user/bottom-sheet";
import { secondaryActionClass } from "@/components/user/user-action-styles";
import { openExternalHttps, openTelegramShare } from "@/lib/open-external";
import {
  linkedinShareUrl,
  telegramShareUrl,
  twitterShareUrl
} from "@/shared/share";

const formats = [
  { id: "story", label: "کارت استوری" },
  { id: "square", label: "کارت مربعی" },
  { id: "landscape", label: "کارت افقی" }
] as const;

type Preview = {
  format: (typeof formats)[number]["id"];
  objectUrl: string;
  blob: Blob;
  filename: string;
};

export function ShareCardButton({
  eventId,
  shareUrl,
  shareText
}: {
  eventId: string;
  shareUrl: string;
  shareText: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    return () => {
      if (preview?.objectUrl) URL.revokeObjectURL(preview.objectUrl);
    };
  }, [preview?.objectUrl]);

  async function handleFormat(format: (typeof formats)[number]["id"]) {
    setBusy(format);
    setError(null);
    if (preview?.objectUrl) URL.revokeObjectURL(preview.objectUrl);
    setPreview(null);

    try {
      const url = `/api/events/${eventId}/share-card?format=${format}`;
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        const text = (await response.text()).slice(0, 180);
        throw new Error(text || `ساخت کارت ناموفق بود (${response.status})`);
      }

      const blob = await response.blob();
      const contentType = response.headers.get("content-type") || blob.type;
      if (!contentType.includes("image") || blob.size < 64) {
        throw new Error("خروجی کارت تصویر معتبر نیست.");
      }

      const filename = `ham-masir-${format}.png`;
      const objectUrl = URL.createObjectURL(blob);
      setPreview({ format, objectUrl, blob, filename });
    } catch (err) {
      setError(err instanceof Error ? err.message : "ساخت کارت ناموفق بود.");
    } finally {
      setBusy(null);
    }
  }

  async function downloadPreview() {
    if (!preview) return;
    setError(null);
    try {
      const tg = window.Telegram?.WebApp as
        | {
            downloadFile?: (
              params: { url: string; file_name: string },
              callback?: (ok: boolean) => void
            ) => void;
          }
        | undefined;
      if (tg?.downloadFile) {
        tg.downloadFile(
          { url: preview.objectUrl, file_name: preview.filename },
          (ok) => {
            if (!ok) downloadWithAnchor(preview.objectUrl, preview.filename);
          }
        );
        return;
      }
      downloadWithAnchor(preview.objectUrl, preview.filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : "دانلود تصویر انجام نشد.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${secondaryActionClass} mt-3`}
      >
        <Share2 size={16} aria-hidden="true" />
        دعوت دوستان
      </button>
      <BottomSheet
        open={open}
        onClose={() => {
          setOpen(false);
          setError(null);
        }}
        title="دعوت به برنامه"
      >
        <div className="grid gap-3" dir="rtl">
          <p className="text-sm leading-7 text-slate-300">{shareText}</p>
          <button
            type="button"
            onClick={() =>
              openTelegramShare(telegramShareUrl(shareUrl, shareText))
            }
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-4 text-sm font-black text-[#061124]"
          >
            ارسال در تلگرام
          </button>
          <button
            type="button"
            onClick={() => openExternalHttps(twitterShareUrl(shareUrl, shareText))}
            className={`${secondaryActionClass}`}
          >
            اشتراک در ایکس
          </button>
          <button
            type="button"
            onClick={() => openExternalHttps(linkedinShareUrl(shareUrl))}
            className={`${secondaryActionClass}`}
          >
            اشتراک در لینکدین
          </button>

          <p className="pt-1 text-xs font-bold text-slate-400">
            اگر کارت تصویری می‌خواهی، یکی از قالب‌ها را بساز.
          </p>
          {formats.map((format) => {
            const isBusy = busy === format.id;
            return (
              <button
                key={format.id}
                type="button"
                disabled={Boolean(busy)}
                aria-busy={isBusy || undefined}
                onClick={() => handleFormat(format.id)}
                className={`${secondaryActionClass} disabled:opacity-60`}
              >
                <span>{isBusy ? "در حال ساخت…" : format.label}</span>
                {isBusy ? (
                  <Loader2 size={16} className="animate-spin text-[#F59E0B]" />
                ) : (
                  <Download size={16} className="text-[#F59E0B]" />
                )}
              </button>
            );
          })}

          {error ? (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200">
              {error}
            </p>
          ) : null}

          {preview ? (
            <div className="grid gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.objectUrl}
                alt="کارت دعوت"
                className="max-h-[40vh] w-full rounded-xl bg-black/30 object-contain"
              />
              <button
                type="button"
                onClick={() => void downloadPreview()}
                className={`${secondaryActionClass}`}
              >
                <Download size={16} aria-hidden="true" />
                دانلود تصویر کارت
              </button>
            </div>
          ) : null}
        </div>
      </BottomSheet>
    </>
  );
}

function downloadWithAnchor(href: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
