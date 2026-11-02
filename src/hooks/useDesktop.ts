"use client";
import { useCallback, useSyncExternalStore } from "react";
/** Match the app's lg breakpoint, including resize, without guessing from user agent. */
export function useDesktop(minWidth = 1024) {
  const query = `(min-width: ${minWidth}px)`;
  const subscribe = useCallback(
    (notify: () => void) => {
      if (!window.matchMedia) return () => {};
      const media = window.matchMedia(query);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia?.(query).matches ?? false,
    () => false,
  );
}
