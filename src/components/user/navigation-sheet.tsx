"use client";

import { MapPinned } from "lucide-react";
import { useState } from "react";
import { BottomSheet } from "@/components/user/bottom-sheet";
import { secondaryActionClass } from "@/components/user/user-shell";
import {
  buildMapServiceLinks,
  type MapServiceLink
} from "@/lib/maps-links";

function openMapService(service: MapServiceLink) {
  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  if (!isMobile) {
    window.open(service.webFallback, "_blank", "noopener,noreferrer");
    return;
  }

  const started = Date.now();
  window.location.href = service.deepLink;
  window.setTimeout(() => {
    if (Date.now() - started < 2200) {
      window.open(service.webFallback, "_blank", "noopener,noreferrer");
    }
  }, 1200);
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
        className={`${secondaryActionClass} mt-3 border-[#F59E0B]/30 text-[#F59E0B]`}
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
              onClick={() => openMapService(service)}
              className="flex min-h-12 items-center justify-between rounded-xl bg-white/[0.06] px-4 text-sm font-bold text-white transition active:bg-white/10"
            >
              <span>{service.name}</span>
              <span className="text-xs text-[#F59E0B]">باز کردن</span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
