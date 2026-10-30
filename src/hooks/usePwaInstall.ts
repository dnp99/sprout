"use client";
import { useSyncExternalStore } from "react";
import { pwaInstall } from "@/lib/pwa/install-controller";
export type { InstallOutcome, PwaInstallState } from "@/lib/pwa/install-controller";

/** Settings consumes document-scoped capability state without owning listeners. */
export function usePwaInstall() {
  return useSyncExternalStore(
    pwaInstall.subscribe,
    pwaInstall.getSnapshot,
    pwaInstall.getServerSnapshot,
  );
}
