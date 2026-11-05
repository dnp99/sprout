"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useGroupConfirmation } from "./useGroupConfirmation";

/** Ordinary group navigation asks before losing session-only financial drafts;
 * a full browser departure uses its native unsaved-changes protection. */
export function useSettlementLeaveGuard(busy = false) {
  const [dirty, setDirty] = useState(false);
  const t = useTranslations("groups");
  const { confirm, confirmation } = useGroupConfirmation();
  useEffect(() => {
    if (!dirty && !busy) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, busy]);
  return {
    setDirty,
    confirmation,
    beforeLeave: async () => !dirty || (await confirm(t("splitDiscardDraft"))),
  };
}
