"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

/** Await an explicit choice without blocking the browser or losing the form draft. */
export function useGroupConfirmation() {
  const t = useTranslations("groups");
  const [message, setMessage] = useState<string | null>(null);
  const pending = useRef<((value: boolean) => void) | null>(null);
  useEffect(
    () => () => {
      pending.current?.(false);
    },
    [],
  );
  const settle = (value: boolean) => {
    const resolve = pending.current;
    pending.current = null;
    setMessage(null);
    resolve?.(value);
  };
  const confirm = (text: string) =>
    new Promise<boolean>((resolve) => {
      // Repeated close clicks must not overwrite the choice already being awaited.
      if (pending.current) {
        resolve(false);
        return;
      }
      pending.current = resolve;
      setMessage(text);
    });
  const confirmation =
    message === null
      ? null
      : createPortal(
          <div data-ledger-context="group">
            <ConfirmDialog
              title={t("confirmationTitle")}
              message={message}
              confirmLabel={t("confirmAction")}
              cancelLabel={t("cancel")}
              onConfirm={() => settle(true)}
              onCancel={() => settle(false)}
            />
          </div>,
          document.body,
        );
  return { confirm, confirmation };
}
