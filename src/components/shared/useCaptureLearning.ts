"use client";

import { useSyncExternalStore } from "react";
import { useStore } from "@/state/store";

type Lesson = "capture" | "import";
const EVENT = "sprout-capture-learning";
function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** Learning is acknowledged explicitly, not inferred from having created a
 * token or imported financial data. Scope browser progress to this account. */
export function useCaptureLearning() {
  const userId = useStore((s) => s.user.id);
  const key = `sprout-learning-${userId}`;
  const read = () => {
    try {
      return localStorage.getItem(key) ?? "";
    } catch {
      return "";
    }
  };
  const progress = useSyncExternalStore(subscribe, read, () => "");
  return {
    learned: (lesson: Lesson) => progress.split(",").includes(lesson),
    complete: (lesson: Lesson) => {
      try {
        localStorage.setItem(
          key,
          [...new Set([...read().split(",").filter(Boolean), lesson])].join(","),
        );
        window.dispatchEvent(new Event(EVENT));
      } catch {
        /* Private browser storage may be unavailable. */
      }
    },
  };
}
