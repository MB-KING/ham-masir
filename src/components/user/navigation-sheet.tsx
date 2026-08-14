"use client";

import { MapPinned } from "lucide-react";
import { useState } from "react";
import { BottomSheet } from "@/components/user/bottom-sheet";
import { secondaryActionClass } from "@/components/user/user-action-styles";
import {
  buildMapServiceLinks,
  type MapServiceLink
} from "@/lib/maps-links";
import { openExternalHttps } from "@/lib/open-external";

function isTelegramMiniApp() {
  if (typeof window === "undefined") return false;
  const tg = (
    window as unknown as {
      Telegram?: { WebApp?: { initData?: string } };
    }
  ).Telegram?.WebApp;
  return Boolean(tg?.initData?.trim());
}

function openMapService(service: MapServiceLink) {
  // Telegram WebView blocks custom schemes (neshan://, waze://, …).
  // Universal HTTPS links open the installed app when possible, else the web map.
  if (isTelegramMiniApp()) {
    openExternalHttps(service.webFallback);
    return;
  }

  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  if (!isMobile) {
    openExternalHttps(service.webFallback);
    return;
  }

  // Outside Telegram on mobile: try native scheme briefly, then HTTPS fallback.
  // Prefer not to interrupt if the page is already hidden (app opened).
  const started = Date.now();
  const onHide = () => {
    window.removeEventListener("pagehide", onHide);
    window.removeEventListener("blur", onHide);
  };
  window.addEventListener("pagehide", onHide);
  window.addEventListener("blur", onHide);

  window.location.href = service.deepLink;
  window.setTimeout(() => {
    onHide();
    if (document.visibilityState === "visible" && Date.now() - started < 2500) {
      openExternalHttps(service.webFallback);
    }
  }, 1500);
}

export function NavigationSheet({
  latitude,
  longitude
}: {
  latitude: number;
  longitude: number;
}) {
  const [open, setOpen] = useState(false);
  const services = buildMapServiceLinks(latitude, longitude);

  if (services.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${secondaryActionClass} mt-3 border-ember/30 text-ember`}
      >
        <MapPinned size={16} aria-hidden="true" />
        مسیریابی
      </button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="انتخاب اپ مسیریابی"
      >
        <div className="grid gap-2">
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => {
                openMapService(service);
                setOpen(false);
              }}
              className="flex min-h-12 items-center justify-between rounded-xl bg-white/[0.06] px-4 text-sm font-bold text-white transition active:bg-white/10"
            >
              <span>{service.name}</span>
              <span className="text-xs text-ember">باز کردن</span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
