"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";

function InnerButton({
  label,
  danger,
  confirmMessage
}: {
  label: string;
  danger?: boolean;
  confirmMessage?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(
        "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70",
        danger
          ? "border border-red-400/30 bg-red-500/10 text-red-200"
          : "bg-white/10 text-slate-100 hover:bg-white/15"
      )}
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? (
        <>
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          در حال انجام…
        </>
      ) : (
        label
      )}
    </button>
  );
}

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
    <InnerButton
      label={label}
      danger={danger}
      confirmMessage={confirmMessage}
    />
  );
}
