"use client";

import { readEditedHighlight } from "@/lib/edited-highlight";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useStore as useZustandStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";
import type { AppLocale, LocalePref } from "@/lib/locale";
import {
  applyTheme,
  resolveTheme,
  readPref,
  applyVisualTheme,
  readVisualTheme,
} from "@/lib/appearance";
import type { AppStore } from "./types";
import { createAppStore } from "./create-store";

type AppStoreApi = StoreApi<AppStore>;

const StoreContext = createContext<AppStoreApi | null>(null);

export function StoreProvider({
  children,
  initialLocalePref = "system",
  initialLocale = "en-CA",
}: {
  children: React.ReactNode;
  /** The cookie preference + request-resolved locale from the localized layout
   *  (plan 013), so the store hydrates in the language the server rendered. */
  initialLocalePref?: LocalePref;
  initialLocale?: AppLocale;
}) {
  // One store instance per provider — the lazy initializer runs once, so it's
  // stable across renders and fresh per request on the server.
  const [store] = useState(() =>
    createAppStore({ localePref: initialLocalePref, locale: initialLocale }),
  );

  // Kick off the one-time auth check on mount. Guarded so React strict mode's
  // double-invoke doesn't fire two /api/auth/me requests.
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    void store.getState().bootstrap();
  }, [store]);

  // Reconcile the store's theme with the persisted preference the no-FOUC script
  // already applied to <html>, and — while the preference is "system" — keep
  // following the OS live as it changes. Cleaned up on unmount (strict-mode safe).
  useEffect(() => {
    store.getState().set({ editedHighlight: readEditedHighlight() });
    const visualTheme = readVisualTheme();
    store.getState().set({ visualTheme });
    applyVisualTheme(visualTheme);
    const pref = readPref();
    store.getState().set({ themePref: pref, theme: resolveTheme(pref) });
    applyTheme(resolveTheme(pref));
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (store.getState().themePref !== "system") return;
      const next: "light" | "dark" = mql.matches ? "dark" : "light";
      store.getState().set({ theme: next });
      applyTheme(next);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [store]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

/** Subscribe to the store. Call with no selector to read the whole store
 *  (re-renders on any change), or pass a selector to subscribe to just a slice —
 *  wrap multi-field selectors in `useShallow` to avoid needless re-renders. */
export function useStore(): AppStore;
export function useStore<T>(selector: (state: AppStore) => T): T;
export function useStore<T>(selector?: (state: AppStore) => T) {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used within a StoreProvider");
  return useZustandStore(store, selector as (state: AppStore) => T);
}
