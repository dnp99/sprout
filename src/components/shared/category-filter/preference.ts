"use client";
import { useSyncExternalStore } from "react";
const key = "sprout-category-hide-empty",
  event = "sprout-category-preference";
const snapshot = () => {
  try {
    return sessionStorage.getItem(key) === "true";
  } catch {
    return false;
  }
};
const subscribe = (notify: () => void) => {
  window.addEventListener(event, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(event, notify);
    window.removeEventListener("storage", notify);
  };
};
/** One browser-session visibility preference, shared by both ledgers without
 * sharing category IDs, selection or disclosure state. Storage may be blocked. */
export function useHideEmptyCategories() {
  const value = useSyncExternalStore(subscribe, snapshot, () => false);
  return [
    value,
    (next: boolean) => {
      try {
        sessionStorage.setItem(key, String(next));
      } catch {
        /* Browsing still works without storage. */
      }
      window.dispatchEvent(new Event(event));
    },
  ] as const;
}
