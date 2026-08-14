"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  primaryActionClass,
  secondaryActionClass
} from "@/components/user/user-action-styles";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] flex-col justify-center px-4 text-slate-100">
      <div className="rounded-xl border border-white/10 bg-pine p-5 text-center">
        <h1 className="text-xl font-black text-white">مشکلی پیش آمد</h1>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          صفحه درست بارگذاری نشد. دوباره تلاش کن یا از خانه ادامه بده.
        </p>
        <div className="mt-5 grid gap-2">
          <button
            type="button"
            onClick={reset}
            className={primaryActionClass}
          >
            تلاش دوباره
          </button>
          <Link
            href="/"
            className={secondaryActionClass}
          >
            بازگشت به خانه
          </Link>
        </div>
      </div>
    </main>
  );
}
