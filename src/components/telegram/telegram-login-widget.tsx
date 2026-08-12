"use client";

import { Loader2 } from "lucide-react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { botUsername } from "@/lib/telegram-format";
import { TELEGRAM_NEXT_COOKIE } from "@/modules/auth/telegram-cookie";

export type TelegramLoginWidgetUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

function isMobileBrowser() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function rememberNextPath(nextPath: string) {
  const secure =
    window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TELEGRAM_NEXT_COOKIE}=${encodeURIComponent(nextPath)}; Path=/; Max-Age=600; SameSite=Lax${secure}`;
}

async function postWidgetLogin(user: TelegramLoginWidgetUser) {
  const response = await fetch("/api/auth/telegram-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user)
  });
  if (!response.ok) {
    throw new Error("telegram_login_failed");
  }
}

export function TelegramLoginWidget({
  nextPath = "/",
  onSuccess,
  className
}: {
  nextPath?: string;
  onSuccess?: () => Promise<void> | void;
  className?: string;
}) {
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
  const callbackNameRef = useRef(
    `onTelegramAuth_${Math.random().toString(36).slice(2)}`
  );
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const [status, setStatus] = useState<"loading" | "ready" | "working" | "error">(
    "loading"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    rememberNextPath(nextPath);

    const callbackName = callbackNameRef.current;
    const useRedirect = isMobileBrowser();

    (window as unknown as Record<string, unknown>)[callbackName] = async (
      user: TelegramLoginWidgetUser
    ) => {
      setError(null);
      setStatus("working");
      try {
        await postWidgetLogin(user);
        if (onSuccessRef.current) {
          await onSuccessRef.current();
        } else {
          router.replace(nextPath as never);
          router.refresh();
        }
      } catch (err) {
        if (isRedirectError(err)) {
          throw err;
        }
        setStatus("ready");
        setError("ورود با تلگرام انجام نشد. دوباره تلاش کن.");
      }
    };

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername());
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-userpic", "true");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-lang", "fa");

    if (useRedirect) {
      const authUrl = new URL("/api/auth/telegram-login", window.location.origin);
      authUrl.searchParams.set("next", nextPath);
      script.setAttribute("data-auth-url", authUrl.toString());
    } else {
      script.setAttribute("data-onauth", `${callbackName}(user)`);
    }

    script.onload = () => setStatus("ready");
    script.onerror = () => {
      setStatus("error");
      setError("دکمه ورود تلگرام بارگذاری نشد. صفحه را تازه کن.");
    };

    host.replaceChildren(script);

    return () => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
      host.replaceChildren();
    };
  }, [nextPath, router]);

  return (
    <div className={cn("grid justify-items-center gap-2", className)}>
      <div
        ref={hostRef}
        className={cn(
          "flex min-h-12 min-w-[240px] items-center justify-center",
          status === "working" && "pointer-events-none opacity-60"
        )}
      />
      {status === "loading" || status === "working" ? (
        <p className="inline-flex items-center gap-2 text-xs font-bold text-slate-400">
          <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          {status === "working" ? "در حال ورود…" : "در حال آماده‌سازی ورود…"}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-center text-xs font-bold leading-5 text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
