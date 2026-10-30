"use client";
import { useState, useSyncExternalStore } from "react";
const SIDEBAR_COLLAPSED_KEY = "sprout-sidebar-collapsed";

function readSidebarCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribeToSidebarPreference(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/** The desktop rail remembers its compact state without making it part of the
 * app's server data. `useSyncExternalStore` keeps the server and hydration
 * snapshots aligned, then picks up a saved preference after the first paint. */
export function useSidebarCollapsed() {
  const storedCollapsed = useSyncExternalStore(
    subscribeToSidebarPreference,
    readSidebarCollapsed,
    () => false,
  );
  const [sessionCollapsed, setSessionCollapsed] = useState<boolean | null>(null);
  const collapsed = sessionCollapsed ?? storedCollapsed;

  const toggle = () => {
    const next = !collapsed;
    // Keep the interaction responsive even when private browsing rejects storage.
    setSessionCollapsed(next);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      // Private browsing can reject storage; the current interaction still works.
    }
    window.dispatchEvent(new Event("storage"));
  };

  return { collapsed, toggle };
}
