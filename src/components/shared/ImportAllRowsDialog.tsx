"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import type { MappedRow } from "@/lib/import/types";

/** Read-only, pre-import table for checking every mapped CSV row before any write. */
export function ImportAllRowsDialog({ rows, onClose }: { rows: MappedRow[]; onClose: () => void }) {
  const t = useTranslations("importer");
  const fmt = useFormatters();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop fixed inset-0 z-[90] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-all-rows-title"
        className="flex max-h-[min(760px,calc(100dvh-2rem))] w-full max-w-[1120px] flex-col overflow-hidden rounded-[18px] border border-edge bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-edge px-5 py-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[.08em] text-muted">
              {t("previewLabel")}
            </div>
            <h2
              id="import-all-rows-title"
              className="mt-1 text-[19px] font-bold tracking-[-.02em] text-ink"
            >
              {t("previewAllTitle")}
            </h2>
            <p className="mt-1 text-[12.5px] font-medium text-muted">
              {t("previewAllBody", { count: rows.length })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("closePreview")}
            className="rounded-[10px] p-2 text-muted transition hover:bg-track hover:text-ink"
          >
            <X size={19} />
          </button>
        </header>

        <div className="min-h-0 overflow-auto">
          <table className="w-full min-w-[700px] text-left text-[13px]">
            <thead className="sticky top-0 bg-card text-[11px] font-bold uppercase tracking-[.08em] text-muted shadow-[0_1px_0_var(--edge)]">
              <tr>
                <th className="px-5 py-3">{t("previewMerchant")}</th>
                <th className="px-5 py-3">{t("previewCategory")}</th>
                <th className="px-5 py-3">{t("previewDate")}</th>
                <th className="px-5 py-3 text-right">{t("previewAmount")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-t border-edge">
                  <td className="max-w-[360px] truncate px-5 py-3 font-semibold text-ink">
                    {row.merchant || "—"}
                  </td>
                  <td className="max-w-[260px] truncate px-5 py-3 font-medium text-muted">
                    {row.sourceCategory || "—"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 font-medium text-muted">
                    {row.occurredAt || "—"}
                  </td>
                  <td
                    className={`whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums ${row.amountCents >= 0 ? "text-green" : "text-ink"}`}
                  >
                    {fmt.money(row.amountCents, { signed: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="flex justify-end border-t border-edge px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] border border-edge px-4 py-2 text-[13px] font-semibold text-ink transition hover:bg-track"
          >
            {t("closePreview")}
          </button>
        </footer>
      </section>
    </div>
  );
}
