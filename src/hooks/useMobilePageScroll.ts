"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type Page = { key: string; detail: boolean; top: number };
const ENTRY = "__sproutScrollEntry";
let sequence = 0;
/** One passive listener caches offsets without rendering React on scroll.
 * History entry identities distinguish traversals from fresh tab destinations,
 * even when Next renders the destination before our popstate listeners run. */
export function useMobilePageScroll(key: string, detail: boolean, enabled = true, ready = true) {
  // Subscribe to URL commits independently of store-driven screen changes.
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const pages = useRef(new Map<string, number>());
  const entries = useRef(new Set<string>());
  const entry = useRef<string | null>(null);
  const route = useRef(pathname);
  const traversing = useRef(false);
  const current = useRef<Page | null>(null);
  const pending = useRef<number | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const viewport = ref.current;
    const scroll = () => {
      if (current.current && pending.current === null)
        current.current.top = viewport?.scrollTop ?? 0;
    };
    viewport?.addEventListener("scroll", scroll, { passive: true });
    return () => viewport?.removeEventListener("scroll", scroll);
  }, [enabled]);
  useLayoutEffect(() => {
    if (!enabled || !ref.current) return;
    let stamp = window.history.state?.[ENTRY] as string | undefined;
    const traversal = !!stamp && entries.current.has(stamp);
    if (!stamp) {
      stamp = `scroll-${Date.now()}-${++sequence}`;
      // Preserve Next's router state; only an opaque UI identity is persisted.
      window.history.replaceState({ ...window.history.state, [ENTRY]: stamp }, "");
    }
    if (stamp !== entry.current) traversing.current = traversal && route.current !== pathname;
    entries.current.add(stamp);
    entry.current = stamp;
    route.current = pathname;
    const previous = current.current;
    if (!previous || previous.key !== key) {
      if (previous) pages.current.set(previous.key, previous.top);
      const restore = traversing.current || (previous?.detail && pages.current.has(key));
      traversing.current = false;
      ref.current.dataset.mobileDirection = restore ? "back" : detail ? "forward" : "tab";
      pending.current = restore ? (pages.current.get(key) ?? 0) : 0;
      current.current = { key, detail, top: pending.current };
    }
    if (ready && pending.current !== null) {
      const viewport = ref.current;
      const behavior = viewport.style.scrollBehavior;
      viewport.style.scrollBehavior = "auto";
      viewport.scrollTop = pending.current;
      viewport.style.scrollBehavior = behavior;
      pending.current = null;
    }
  });
  return ref;
}
