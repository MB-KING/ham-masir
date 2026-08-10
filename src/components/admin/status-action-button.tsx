"use client";

import { cn } from "@/lib/cn";

export function StatusActionButton({
  label,
  danger = false,
  confirmMessage
}: {
  label: string;
  danger?: boolean;
  confirmMessage?: string;
}) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 w-full items-center justify-center rounded-xl px-3 text-sm font-bold transition active:scale-[0.99]",
        danger
          ? "border border-red-400/30 bg-red-500/10 text-red-200"
          : "bg-white/10 text-slate-100 hover:bg-white/15"
      )}
      type="submit"
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {label}
    </button>
  );
}
