"use client";

import { X } from "lucide-react";
import { useSyncExternalStore } from "react";

function readDismissed(storageKey: string): boolean {
  try {
    return localStorage.getItem(storageKey) === "1";
  } catch {
    return false;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/** Remembers a one-time dismissal in localStorage, read via
 *  `useSyncExternalStore` so there's no hydration flash (the server snapshot
 *  hides the card until the client reads storage). */
function useDismissible(key: string) {
  const storageKey = `sprout-tip-${key}`;
  const dismissed = useSyncExternalStore(
    subscribe,
    () => readDismissed(storageKey),
    () => true, // server/hydration snapshot: hidden until the client reads storage
  );
  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* ignore private-mode failures */
    }
    // Notify same-tab subscribers (the native `storage` event only fires cross-tab).
    window.dispatchEvent(new Event("storage"));
  };
  return { visible: !dismissed, dismiss };
}

/** A dismissible "did you know" banner used to surface features on Home. The
 *  body opens the feature; the × hides it for good (per-`id` in localStorage). */
export function DiscoveryCard({
  id,
  icon,
  title,
  body,
  onOpen,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  onOpen: () => void;
}) {
  const { visible, dismiss } = useDismissible(id);
  if (!visible) return null;
  return (
    <div className="flex items-center gap-3 rounded-[12px] border border-soft-border bg-primary-soft px-3.5 py-2.5">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-card text-primary">
        {icon}
      </span>
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
        <div className="text-[13px] font-bold text-ink">{title}</div>
        <div className="text-[11.5px] font-medium leading-snug text-muted">{body}</div>
      </button>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="-mr-1 flex h-7 w-7 flex-none items-center justify-center rounded-lg text-muted transition hover:bg-card hover:text-ink"
      >
        <X size={15} strokeWidth={2} />
      </button>
    </div>
  );
}
