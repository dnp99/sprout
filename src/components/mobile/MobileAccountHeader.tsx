"use client";
import { useTranslations } from "next-intl";
import { AccountHeader } from "@/components/shared/AccountHeader";
import { TransactionSpaceBadge } from "@/components/shared/TransactionSpaceBadge";
import type { MobileScreen } from "@/lib/types";

const titles: Partial<Record<MobileScreen, string>> = {
  history: "transactions",
  categories: "budget",
  goals: "goals",
  trends: "trends",
  settings: "settings",
  bills: "billsShort",
};

/** Primary tabs share Transactions' page identity; Home retains its greeting.
 * Detail/editor screens keep their own existing back/title navigation. */
export function MobileAccountHeader({ screen }: { screen: MobileScreen }) {
  const t = useTranslations("nav");
  const title = titles[screen];
  return (
    <AccountHeader
      identityTitle={title ? t(title) : undefined}
      transactionContext={title ? <TransactionSpaceBadge /> : undefined}
    />
  );
}
