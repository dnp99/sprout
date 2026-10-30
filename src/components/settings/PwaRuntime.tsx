"use client";
import { useEffect } from "react";
import { startPwaPresentation } from "@/lib/pwa/presentation";
import { pwaInstall } from "@/lib/pwa/install-controller";

/** Both root layouts capture install capability before Settings is visited. */
export function PwaRuntime() {
  useEffect(() => {
    const stopInstall = pwaInstall.start(window),
      stopPresentation = startPwaPresentation(window);
    return () => {
      stopInstall();
      stopPresentation();
    };
  }, []);
  return null;
}
