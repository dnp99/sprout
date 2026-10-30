import type { PwaInstallState } from "./install-controller";

const KEY = "sprout-install-offer";
const PAUSE_MS = 7 * 24 * 60 * 60 * 1000;

/** Generic browser guidance stays in Settings until the browser offers installation. */
export function canOfferInstall(state: PwaInstallState): boolean {
  return (
    state.status === "prompt-ready" ||
    (state.status === "instructions" && state.platform !== "browser")
  );
}

/** One offer per document, with a device-level pause across later sign-ins.
 * Storage restrictions must never prevent access to the signed-in app. */
export function createInstallOfferGate() {
  let offered = false;
  return (storage: Pick<Storage, "getItem" | "setItem"> | null, now = Date.now()) => {
    if (offered) return false;
    try {
      const previous = storage?.getItem(KEY);
      const timestamp = previous ? Number(previous) : NaN;
      if (isFinite(timestamp) && now - timestamp < PAUSE_MS) return false;
    } catch {
      /* Memory still prevents repeated offers during this document's lifetime. */
    }
    offered = true;
    try {
      storage?.setItem(KEY, String(now));
    } catch {
      /* Optional device preference. */
    }
    return true;
  };
}

export const claimInstallOffer = createInstallOfferGate();
