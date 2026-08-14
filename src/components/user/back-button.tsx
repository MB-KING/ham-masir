"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Route } from "next";

export function BackButton({
  fallbackHref = "/"
}: {
  fallbackHref?: Route;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label="بازگشت"
      title="بازگشت"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
      className="mt-0.5 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-300 transition duration-200 active:scale-95 hover:border-ember/40 hover:text-white"
    >
      <ArrowRight size={19} aria-hidden="true" />
    </button>
  );
}
