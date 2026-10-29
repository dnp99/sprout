"use client";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function DesktopImportComplete({
  result,
  onViewTransactions,
  onImportAnother,
  group = false,
}: {
  result: {
    imported: number;
    excluded: number;
    aiCategorized: number;
    reconciled: number;
    uncategorized: number;
  };
  onViewTransactions: () => void;
  onImportAnother: () => void;
  group?: boolean;
}) {
  const t = useTranslations("importer");
  const g = useTranslations("groups");
  return (
    <div className="mt-4 rounded-[18px] border border-soft-border bg-primary-soft px-6 py-10 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-card text-primary">
        <CheckCircle2 size={30} strokeWidth={2.2} />
      </span>
      <h2 className="mt-4 text-[22px] font-bold tracking-[-.02em] text-ink">
        {t("importComplete")}
      </h2>
      <p className="mx-auto mt-2 max-w-[580px] text-[13px] font-medium leading-relaxed text-muted">
        {group
          ? g("groupImportResult", {
              imported: result.imported,
              skipped: result.excluded,
              duplicates: result.reconciled,
              uncategorized: result.uncategorized,
            })
          : [
              t("resImported", { count: result.imported }),
              t("resExcluded", { count: result.excluded }),
              ...(result.aiCategorized > 0 ? [t("resAi", { count: result.aiCategorized })] : []),
              ...(result.reconciled > 0 ? [t("resReconciled", { count: result.reconciled })] : []),
              t("resUncategorized", { count: result.uncategorized }),
            ].join(" · ")}
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={onViewTransactions}
          className="rounded-[12px] bg-primary px-5 py-3 text-[14px] font-semibold text-onprimary"
        >
          {t("viewTxnsWeb")}
        </button>
        <button
          type="button"
          onClick={onImportAnother}
          className="rounded-[12px] border border-primary px-5 py-3 text-[14px] font-semibold text-primary transition hover:bg-primary-soft"
        >
          {t("importAnother")}
        </button>
      </div>
    </div>
  );
}
