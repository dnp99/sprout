"use client";

import { useEffect } from "react";
import { useStore } from "@/state/store";
import type { AppLocale, LocalePref } from "@/lib/locale";

/** Keeps the store's locale fields in step with the server. The initial values
 *  are seeded into the store at creation (StoreProvider props); this bridge
 *  covers the *next* renders — after Settings changes the cookie and calls
 *  `router.refresh()`, the localized layout re-runs and passes fresh props here,
 *  which land in the (persistent) client store. */
export function LocaleSync({ pref, locale }: { pref: LocalePref; locale: AppLocale }) {
  const set = useStore((s) => s.set);
  useEffect(() => {
    set({ localePref: pref, locale });
  }, [pref, locale, set]);
  return null;
}
