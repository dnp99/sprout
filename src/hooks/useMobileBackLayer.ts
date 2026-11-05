"use client";
import { useEffect, useRef } from "react";
import { useDesktop } from "./useDesktop";
import { openMobileHistoryLayer } from "@/lib/pwa/mobile-history";

/** Keep callbacks current without creating history entries on form changes. */
export function useMobileBackLayer(enabled: boolean, onBack: () => void) {
  const desktop = useDesktop();
  const close = useRef(onBack);
  useEffect(() => {
    close.current = onBack;
  }, [onBack]);
  useEffect(() => {
    if (!enabled || desktop) return;
    return openMobileHistoryLayer(() => close.current());
  }, [enabled, desktop]);
}
