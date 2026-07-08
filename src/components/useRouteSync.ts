"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  pathForSection,
  sectionForMobileScreen,
  sectionForPath,
  sectionMobileScreen,
} from "@/lib/nav";
import { useStore } from "@/state/store";

/** `true` at the `lg` breakpoint and up — i.e. the web surface is the visible
 *  one. Read via useSyncExternalStore so there's no setState-in-effect and no
 *  hydration mismatch (the server snapshot is mobile-first `false`). */
function useIsWide(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(min-width: 1024px)");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => false,
  );
}

/** Mirror section navigation into real URL paths (`/transactions`, `/settings`,
 *  …) for whichever surface is visible, and reflect the URL back into the store
 *  on deep link / refresh / back / forward — so browser history works on the web
 *  *and* mobile surfaces. The category filter rides along as `?cat=`.
 *
 *  Detail/transient mobile screens (transaction detail, add flows, search) don't
 *  change the path; they layer over their parent section. The auth guard in
 *  AppShell owns `/login` `/logout` `/` — this hook only drives section→section
 *  navigation, and only while signed in. */
export function useRouteSync(authed: boolean) {
  const { webView, mobileScreen, txnCategory, set } = useStore(
    useShallow((s) => ({
      webView: s.webView,
      mobileScreen: s.mobileScreen,
      txnCategory: s.txnCategory,
      set: s.set,
    })),
  );
  const pathname = usePathname();
  const router = useRouter();
  const isWide = useIsWide();

  // The section the *visible* surface is showing. Null when a mobile detail
  // screen is open — then we leave the URL parked on its parent section.
  const activeSection = isWide ? webView : sectionForMobileScreen(mobileScreen);

  // URL → store: hydrate on mount (deep link / refresh) and on back/forward.
  // Reflecting the URL sets *both* surfaces' nav so they stay coherent across a
  // resize. Reconciling never pushes a new entry: the store→URL effect below
  // finds the derived path already equal to the location.
  useEffect(() => {
    if (!authed) return;
    const applyFromUrl = () => {
      const section = sectionForPath(window.location.pathname);
      if (!section) return; // /login, /logout, unknown — the auth guard owns these
      const cat = new URLSearchParams(window.location.search).get("cat");
      set({
        webView: section,
        mobileScreen: sectionMobileScreen(section),
        ...(section === "transactions" ? { txnCategory: cat || "all" } : {}),
      });
    };
    applyFromUrl();
    window.addEventListener("popstate", applyFromUrl);
    return () => window.removeEventListener("popstate", applyFromUrl);
  }, [authed, pathname, set]);

  // store → URL: push a path when the visible surface switches section (or its
  // category filter changes). Skip the first commit so mount-time hydration
  // isn't clobbered before it applies.
  const firstRun = useRef(true);
  useEffect(() => {
    if (!authed || !activeSection) return;
    // Only drive section→section navigation; the auth guard places us onto a
    // section route first (from /login, /, or an unknown path).
    if (!sectionForPath(window.location.pathname)) return;
    // Skip the first time we'd actually act, so the initial nav state doesn't
    // clobber the deep-linked URL before the URL→store effect hydrates it. The
    // guard sits *after* the auth checks so the booting phase doesn't burn it.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    let target = pathForSection(activeSection);
    if (activeSection === "transactions" && txnCategory !== "all") {
      target += `?cat=${txnCategory}`;
    }
    if (target !== window.location.pathname + window.location.search) {
      router.push(target);
    }
  }, [authed, activeSection, txnCategory, router]);
}
