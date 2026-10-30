"use client";

import { useEffect, useState } from "react";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { canOfferInstall, claimInstallOffer } from "@/lib/pwa/install-offer";
import { PwaInstallCard } from "./PwaInstallCard";

/** Mounted only behind the auth boundary, shared by Personal and Group routes. */
export function PwaSignInPrompt() {
  const state = usePwaInstall();
  const eligible = canOfferInstall(state);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!eligible) return;
    // Let the signed-in destination settle; never steal focus from the ledger.
    const timer = window.setTimeout(() => {
      let storage: Storage | null = null;
      try {
        storage = window.localStorage;
      } catch {
        /* Optional device preference. */
      }
      if (claimInstallOffer(storage)) setOpen(true);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [eligible]);
  if (
    !open ||
    state.status === "installed" ||
    state.status === "unavailable" ||
    state.status === "install-requested"
  )
    return null;
  return (
    <div className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-[70] mx-auto max-w-[400px] rounded-[14px] shadow-xl lg:inset-x-auto lg:right-6 lg:bottom-6 lg:mx-0">
      <PwaInstallCard onDismiss={() => setOpen(false)} />
    </div>
  );
}
