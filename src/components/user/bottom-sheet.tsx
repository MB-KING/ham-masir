"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import { miniAppWidthClass } from "@/components/user/mini-app";

export function BottomSheet({
  open,
  onClose,
  title,
  children
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="بستن"
        className="absolute inset-0 bg-black/55"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute bottom-0 left-1/2 flex w-full max-h-[calc(100dvh-env(safe-area-inset-top)-0.5rem)] -translate-x-1/2 flex-col overflow-hidden px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
          miniAppWidthClass
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#07162E] shadow-[0_-12px_40px_rgba(0,0,0,0.45)]">
          <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-4 pb-3">
            <h3 className="text-base font-black text-white">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-slate-300"
              aria-label="بستن"
            >
              <X size={18} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
