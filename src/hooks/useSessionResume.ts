"use client";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/Toast";
import { useStore } from "@/state/store";
import { fetchWithTimeout } from "@/lib/api";
import { subscribeToForeground } from "@/lib/pwa/foreground";

/** Verify identity before resuming either ledger. Active drafts retain their
 * loaded revisions; refreshing never submits a write or recalculates a split. */
export function useSessionResume(group: boolean) {
  const {
    userId,
    flowStep,
    refresh,
    clearSessionState,
    webView,
    mobileScreen,
    webAddOpen,
    webEditTxnId,
    webAddCategoryOpen,
    webEditBudgetOpen,
    addSubmitting,
  } = useStore(
    useShallow((s) => ({
      userId: s.user.id,
      flowStep: s.flowStep,
      refresh: s.refresh,
      clearSessionState: s.clearSessionState,
      webView: s.webView,
      mobileScreen: s.mobileScreen,
      webAddOpen: s.webAddOpen,
      webEditTxnId: s.webEditTxnId,
      webAddCategoryOpen: s.webAddCategoryOpen,
      webEditBudgetOpen: s.webEditBudgetOpen,
      addSubmitting: s.addSubmitting,
    })),
  );
  const t = useTranslations("settingsPage.pwa"),
    { showToast } = useToast();
  useEffect(() => {
    if (flowStep !== "done" || !userId) return;
    let active = true;
    const stop = subscribeToForeground(window, async () => {
      try {
        const response = await fetchWithTimeout("/api/auth/me");
        if (!active) return;
        if (response.status === 401) {
          clearSessionState();
          showToast(t("signInAgain"), "error");
          return;
        }
        if (!response.ok) throw Error("Session refresh failed");
        const data = await response.json();
        if (!active) return;
        if (data.user?.id !== userId) {
          clearSessionState();
          showToast(t("signInAgain"), "error");
          return;
        }
        if (group) {
          window.dispatchEvent(new Event("sprout:resume"));
          return;
        }
        const desktop = window.matchMedia("(min-width: 1024px)").matches;
        const reading = desktop
          ? ["overview", "transactions", "trends"].includes(webView)
          : ["home", "history", "search", "trends"].includes(mobileScreen);
        if (
          reading &&
          !webAddOpen &&
          !webEditTxnId &&
          !webAddCategoryOpen &&
          !webEditBudgetOpen &&
          !addSubmitting &&
          !document.querySelector('[role="dialog"],input:focus,textarea:focus,select:focus')
        )
          await refresh();
      } catch {
        if (active) showToast(t("refreshFailed"), "error");
      }
    });
    return () => {
      active = false;
      stop();
    };
  }, [
    userId,
    flowStep,
    group,
    refresh,
    clearSessionState,
    webView,
    mobileScreen,
    webAddOpen,
    webEditTxnId,
    webAddCategoryOpen,
    webEditBudgetOpen,
    addSubmitting,
    showToast,
    t,
  ]);
}
