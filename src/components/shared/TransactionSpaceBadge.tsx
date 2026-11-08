"use client";

import type { ReactNode } from "react";
import { UserRound, Users } from "lucide-react";
import { useTranslations } from "next-intl";

/** A bounded identity pill keeps long group names from displacing account access. */
export function TransactionSpaceBadge({
  group = false,
  name,
  children,
}: {
  group?: boolean;
  name?: string;
  children?: ReactNode;
}) {
  const t = useTranslations("groups");
  const Icon = group ? Users : UserRound;
  return (
    <div className="transaction-space-badge" title={name}>
      <Icon size={14} strokeWidth={2} className="shrink-0" aria-hidden="true" />
      {children ?? <span className="truncate">{group ? name || t("title") : t("personal")}</span>}
    </div>
  );
}
