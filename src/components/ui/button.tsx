import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-4 text-sm font-black text-[#061124] shadow-sm shadow-[#F59E0B]/20 transition active:scale-[0.99] hover:bg-[#FBBF24] disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      {...props}
    />
  );
}
