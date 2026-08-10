"use client";

import { Download, Share2 } from "lucide-react";
import { useState } from "react";
import { BottomSheet } from "@/components/user/bottom-sheet";
import { secondaryActionClass } from "@/components/user/user-shell";

const formats = [
  { id: "story", label: "استوری ۹:۱۶" },
  { id: "square", label: "مربع ۱:۱" },
  { id: "landscape", label: "افقی" }
] as const;

export function ShareCardButton({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function handleFormat(format: (typeof formats)[number]["id"]) {
    setBusy(format);
    try {
      const url = `/api/events/${eventId}/share-card?format=${format}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("failed");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const filename = `ham-masir-${eventId}-${format}.png`;

      const tg = (
        window as unknown as {
          Telegram?: { WebApp?: { downloadFile?: (opts: unknown) => void } };
        }
      ).Telegram?.WebApp;

      if (tg?.downloadFile) {
        const reader = new FileReader();
        reader.onload = () => {
          tg.downloadFile?.({
            url: reader.result,
            file_name: filename
          });
        };
        reader.readAsDataURL(blob);
      } else if (navigator.share && navigator.canShare?.({ files: [new File([blob], filename, { type: "image/png" })] })) {
        await navigator.share({
          files: [new File([blob], filename, { type: "image/png" })],
          title: "هم مسیر"
        });
      } else {
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = filename;
        a.click();
      }
      URL.revokeObjectURL(objectUrl);
      setOpen(false);
    } catch {
      window.open(`/api/events/${eventId}/share-card?format=${format}`, "_blank");
    } finally {
      setBusy(null);
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
      <BottomSheet open={open} onClose={() => setOpen(false)} title="ساخت کارت اشتراک">
        <div className="grid gap-2">
          {formats.map((format) => (
            <button
              key={format.id}
              type="button"
              disabled={busy === format.id}
              onClick={() => handleFormat(format.id)}
              className="flex min-h-12 items-center justify-between rounded-xl bg-white/[0.06] px-4 text-sm font-bold text-white disabled:opacity-60"
            >
              <span>{format.label}</span>
              <Download size={16} className="text-[#F59E0B]" />
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
