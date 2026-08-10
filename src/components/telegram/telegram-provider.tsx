"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready: () => void;
        expand: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        openLink?: (
          url: string,
          options?: { try_instant_view?: boolean }
        ) => void;
        openTelegramLink?: (url: string) => void;
      };
    };
  }
}

async function loginWithInitData(initData: string) {
  const response = await fetch("/api/auth/telegram", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData })
  });

  if (!response.ok) {
    throw new Error("telegram_login_failed");
  }
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [scriptReady, setScriptReady] = useState(false);
  const bootstrapped = useRef(false);

  const bootstrap = useCallback(async () => {
    if (bootstrapped.current || typeof window === "undefined") {
      return;
    }

    const webApp = window.Telegram?.WebApp;
    const initData = webApp?.initData?.trim();
    if (!webApp || !initData) {
      return;
    }

    bootstrapped.current = true;
    webApp.ready();
    webApp.expand();
    webApp.setHeaderColor?.("#0B1E43");
    webApp.setBackgroundColor?.("#061124");

    try {
      await loginWithInitData(initData);
      router.refresh();
    } catch {
      bootstrapped.current = false;
    }
  }, [router]);

  useEffect(() => {
    if (scriptReady) {
      void bootstrap();
    }
  }, [bootstrap, scriptReady]);

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      {children}
    </>
  );
}
