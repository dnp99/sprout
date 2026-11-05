"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

/** The shell supplies an explicit same-group destination so direct links work
 * too; its existing navigation guard remains responsible for pending changes. */
export function GroupTransactionsBack({ busy, onBack }: { busy: boolean; onBack: () => void }) {
  const t = useTranslations("groups");
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onBack}
      className="inline-flex min-h-11 items-center gap-2 text-meta font-medium text-muted hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <ArrowLeft size={16} strokeWidth={2} aria-hidden="true" />
      {t("backToTransactions")}
    </button>
  );
}
