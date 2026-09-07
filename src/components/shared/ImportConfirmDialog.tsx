"use client";

import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/overlays";

/** Final import confirmation, with an optional link to inspect the full file. */
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
  return (
    <Modal onClose={onCancel} title={t("confirmImportTitle")} width={460}>
      <div className="pt-4">
        <p className="text-[14px] leading-relaxed text-muted">
          {t("confirmImportBody", { count: rowCount })}
        </p>
        <button
          type="button"
          onClick={onReview}
          className="mt-3 text-[13px] font-semibold text-primary underline underline-offset-4"
        >
          {t("confirmImportReview", { count: rowCount })}
        </button>
        <p className="mt-4 rounded-[10px] border border-edge bg-track/40 px-3 py-2 text-[12px] leading-relaxed text-muted">
          {t("confirmImportCategories")}
        </p>
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
            disabled={busy}
            className="rounded-[10px] bg-primary px-4 py-2.5 text-[13px] font-semibold text-onprimary transition disabled:opacity-50"
          >
            {busy ? t("importing") : t("confirmImportCta")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
