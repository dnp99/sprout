"use client";

import { UserRound, Users } from "lucide-react";
import { useTranslations } from "next-intl";

/** Explicit identity survives palette changes and does not rely on color alone. */
export function LedgerContextLabel({ group = false, name }: { group?: boolean; name?: string }) {
  const t = useTranslations("groups");
  const Icon = group ? Users : UserRound;
  return (
    <div className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium leading-5 text-muted">
      <Icon size={14} strokeWidth={2} className="shrink-0" aria-hidden="true" />
      <span className="truncate" title={group && name ? name : undefined}>
        {group && name ? t("groupContext", { name }) : t(group ? "groupSpace" : "personalSpace")}
      </span>
    </div>
  );
}
