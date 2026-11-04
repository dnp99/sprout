"use client";
import { UserRound, Users } from "lucide-react";
import { useTranslations } from "next-intl";

/** Quiet desktop identity; mobile already names the ledger in its greeting. */
export function DesktopLedgerIcon({ group = false }: { group?: boolean }) {
  const t = useTranslations("groups");
  const Icon = group ? Users : UserRound;
  return (
    <span className="hidden shrink-0 items-center text-muted lg:inline-flex">
      <Icon size={18} strokeWidth={2} aria-hidden="true" />
      <span className="sr-only">{t(group ? "groupSpace" : "personalSpace")}: </span>
    </span>
  );
}
