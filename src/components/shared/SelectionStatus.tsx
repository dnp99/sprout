"use client";
import { useTranslations } from "next-intl";

/** Hidden selections remain actionable, so disclose them beside the total. */
export function SelectionStatus({ count, hidden = 0 }: { count: number; hidden?: number }) {
  const t = useTranslations("txns");
  return (
    <span className="inline-flex flex-col">
      <span>{t("selectedN", { count })}</span>
      {hidden > 0 && (
        <span className="text-meta font-normal text-muted">
          {t("hiddenSelected", { count: hidden })}
        </span>
      )}
    </span>
  );
}
