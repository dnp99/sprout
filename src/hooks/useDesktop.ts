"use client";
import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 1024px)";
const subscribe = (notify: () => void) => {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
/** Match the app's lg breakpoint, including resize, without guessing from user agent. */
export function useDesktop() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
