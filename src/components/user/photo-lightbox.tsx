"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

export function PhotoLightbox({
  src,
  alt,
  caption,
  children
}: {
  src: string;
  alt: string;
  caption?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-black/20 text-right transition duration-200"
      >
        {children}
      </button>
      {open ? (
        <div className="fixed inset-0 z-[80] bg-black/95 animate-fade-in">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-3 z-[81] inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/10 px-3 text-sm font-black text-white transition duration-200 active:scale-95"
            style={{ top: "calc(0.75rem + env(safe-area-inset-top))" }}
            aria-label="بازگشت"
          >
            <X size={18} aria-hidden="true" />
            بازگشت
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-contain p-3 pt-16"
          />
          {caption ? (
            <p className="pointer-events-none absolute bottom-4 left-1/2 w-[min(92%,28rem)] -translate-x-1/2 truncate rounded-xl bg-black/60 px-3 py-2 text-center text-sm font-bold text-white">
              {caption}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
