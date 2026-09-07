"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/overlays";

/** Requires an explicit full-preview visit before a CSV can be written. */
export function ImportConfirmDialog({
  rowCount,
  busy,
  onCancel,
  onReview,
  onConfirm,
}: {
  rowCount: number;
  busy: boolean;
  onCancel: () => void;
  onReview: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("importer");
  const [reviewed, setReviewed] = useState(false);

  function openReview() {
    setReviewed(true);
    onReview();
  }

  return (
    <Modal onClose={onCancel} title={t("confirmImportTitle")} width={460}>
      <div className="pt-4">
        <p className="text-[14px] leading-relaxed text-muted">
          {t("confirmImportBody", { count: rowCount })}
        </p>
        <button
          type="button"
          onClick={openReview}
          className="mt-3 text-[13px] font-semibold text-primary underline underline-offset-4"
        >
          {t("confirmImportReview", { count: rowCount })}
        </button>
        {!reviewed && (
          <p className="mt-2 text-[12px] font-medium text-muted">{t("confirmImportRequired")}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-[10px] px-4 py-2.5 text-[13px] font-semibold text-muted transition hover:bg-track disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!reviewed || busy}
            className="rounded-[10px] bg-primary px-4 py-2.5 text-[13px] font-semibold text-onprimary transition disabled:opacity-50"
          >
            {busy ? t("importing") : t("confirmImportCta")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
