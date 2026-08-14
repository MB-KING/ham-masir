"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";

type PendingSubmitButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> & {
  children: ReactNode;
  pendingLabel?: string;
  idleIcon?: ReactNode;
};

export function PendingSubmitButton({
  children,
  className,
  disabled,
  pendingLabel = "در حال انجام…",
  idleIcon,
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = Boolean(disabled || pending);

  return (
    <button
      type="submit"
      disabled={isDisabled}
      aria-busy={pending || undefined}
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition duration-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70",
        className
      )}
      {...props}
    >
      {pending ? (
        <>
          <Loader2 size={16} className="animate-spin shrink-0" aria-hidden="true" />
          <span>{pendingLabel}</span>
        </>
      ) : (
        <>
          {idleIcon}
          {children}
        </>
      )}
    </button>
  );
}
