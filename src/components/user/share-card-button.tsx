"use client";

import { Download, Loader2, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/user/bottom-sheet";
import { secondaryActionClass } from "@/components/user/user-action-styles";

const formats = [
  { id: "story", label: "استوری ۹:۱۶" },
  { id: "square", label: "مربع ۱:۱" },
  { id: "landscape", label: "افقی" }
] as const;

type Preview = {
  format: (typeof formats)[number]["id"];
  objectUrl: string;
  blob: Blob;
  filename: string;
};

export function ShareCardButton({ eventId }: { eventId: string }) {
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

  async function sharePreview() {
    if (!preview) return;
    setError(null);
    try {
      const file = new File([preview.blob], preview.filename, {
        type: preview.blob.type || "image/png"
      });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "هم مسیر" });
        return;
      }

      const anchor = document.createElement("a");
      anchor.href = preview.objectUrl;
      anchor.download = preview.filename;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "برای ذخیره، روی تصویر انگشت بگذار و Save image را بزن."
      );
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
        کارت اشتراک
      </button>
      <BottomSheet
        open={open}
        onClose={() => {
          setOpen(false);
          setError(null);
        }}
        title="ساخت کارت اشتراک"
      >
        <div className="grid gap-3">
          {formats.map((format) => {
            const isBusy = busy === format.id;
            return (
              <button
                key={format.id}
                type="button"
                disabled={Boolean(busy)}
                aria-busy={isBusy || undefined}
                onClick={() => handleFormat(format.id)}
                className="flex min-h-12 items-center justify-between rounded-xl bg-white/[0.06] px-4 text-sm font-bold text-white disabled:opacity-60"
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
                alt="کارت اشتراک"
                className="max-h-[50vh] w-full rounded-xl object-contain bg-black/30"
              />
              <p className="text-xs leading-6 text-slate-400">
                اگر دکمه ذخیره کار نکرد، روی تصویر انگشت بگذار و Save image را
                بزن.
              </p>
              <button
                type="button"
                onClick={sharePreview}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-4 text-sm font-black text-[#061124]"
              >
                <Download size={16} aria-hidden="true" />
                ذخیره / اشتراک
              </button>
            </div>
          ) : null}
        </div>
      </BottomSheet>
    </>
  );
}
