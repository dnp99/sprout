"use client";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/Toast";

/** Return to the original ledger without switching mode or opening duplicate
 * account dialogs in simultaneously mounted mobile/desktop layouts. */
export function GoogleLinkFeedback() {
  const result = useSearchParams().get("google_link");
  const handled = useRef<string | null>(null);
  const t = useTranslations("auth");
  const { showToast } = useToast();
  useEffect(() => {
    if (!result || handled.current === result) return;
    handled.current = result;
    const key =
      result === "success"
        ? "googleLinkSuccess"
        : result === "email"
          ? "googleLinkEmail"
          : result === "conflict"
            ? "googleLinkConflict"
            : result === "cancelled"
              ? "googleCancelled"
              : "googleFailed";
    showToast(t(key), result === "success" ? "success" : "error", undefined, 8000);
    const url = new URL(window.location.href);
    url.searchParams.delete("google_link");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [result, showToast, t]);
  return null;
}
