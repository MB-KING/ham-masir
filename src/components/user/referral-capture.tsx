"use client";

import { useEffect } from "react";

const COOKIE = "hm_ref";

export function ReferralCapture() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref")?.trim();
    if (!ref || !/^[0-9a-f-]{36}$/i.test(ref)) return;
    document.cookie = `${COOKIE}=${ref}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  }, []);
  return null;
}
