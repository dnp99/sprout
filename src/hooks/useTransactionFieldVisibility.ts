"use client";
import { useEffect, type RefObject } from "react";

/** iOS resizes/pans the visual viewport after focus. Follow the active field
 * inside the form's own scroller instead of letting the browser pan the page. */
export function useTransactionFieldVisibility(
  ref: RefObject<HTMLDivElement | null>,
  enabled = true,
) {
  useEffect(() => {
    const region = ref.current;
    if (!region || !enabled) return;
    let frame = 0;
    const reveal = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const field = document.activeElement;
        if (!(field instanceof HTMLElement) || !region.contains(field)) return;
        if (!field.matches("input,textarea,select,[role=combobox]")) return;
        const bounds = region.getBoundingClientRect();
        const rect = field.getBoundingClientRect();
        const top = bounds.top + 12;
        const bottom = bounds.bottom - 12;
        if (rect.bottom > bottom) region.scrollTop += rect.bottom - bottom;
        else if (rect.top < top) region.scrollTop -= top - rect.top;
      });
    };
    region.addEventListener("focusin", reveal);
    window.visualViewport?.addEventListener("resize", reveal);
    window.visualViewport?.addEventListener("scroll", reveal);
    window.addEventListener("resize", reveal);
    // The modal can nominate its initial input before this effect subscribes.
    reveal();
    return () => {
      cancelAnimationFrame(frame);
      region.removeEventListener("focusin", reveal);
      window.visualViewport?.removeEventListener("resize", reveal);
      window.visualViewport?.removeEventListener("scroll", reveal);
      window.removeEventListener("resize", reveal);
    };
  }, [ref, enabled]);
}
