export type MapServiceId = "google" | "waze" | "neshan" | "balad";

export type MapServiceLink = {
  id: MapServiceId;
  name: string;
  /** Prefer deep link on mobile when available */
  deepLink: string;
  webFallback: string;
};

export function buildMapServiceLinks(
  latitude: number,
  longitude: number
): MapServiceLink[] {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return [];
  }

  const q = `${lat},${lng}`;

  return [
    {
      id: "google",
      name: "Google Maps",
      deepLink: `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`,
      webFallback: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`
    },
    {
      id: "waze",
      name: "Waze",
      deepLink: `waze://?ll=${lat},${lng}&navigate=yes`,
      webFallback: `https://waze.com/ul?ll=${encodeURIComponent(q)}&navigate=yes`
    },
    {
      id: "neshan",
      name: "نشان",
      deepLink: `neshan://search?q=${lat},${lng}`,
      // HTTPS opens outside Telegram via WebApp.openLink, then can hand off to the app.
      webFallback: `https://neshan.org/maps/routing/car/destination/${lat},${lng}`
    },
    {
      id: "balad",
      name: "بلد",
      deepLink: `balad://direction?destination=${lat},${lng}`,
      webFallback: `https://balad.ir/directions/driving?destination=${lat}%2C${lng}`
    }
  ];
}
