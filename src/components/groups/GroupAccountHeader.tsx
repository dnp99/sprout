"use client";
import { AccountHeader } from "@/components/shared/AccountHeader";
import { LedgerContextLabel } from "@/components/shared/LedgerContextLabel";
import { GroupChooser } from "./GroupChooser";
import { TransactionSpaceBadge } from "@/components/shared/TransactionSpaceBadge";
import { useTranslations } from "next-intl";

/** Mobile group identity belongs to the account header across ledger sections. */
export function GroupAccountHeader({
  id,
  name,
  groups,
  disabled,
  onChange,
  transactions = false,
  trends = false,
}: {
  id?: string;
  name?: string;
  groups: { id: string; name: string }[];
  disabled: boolean;
  onChange: (id: string) => void;
  transactions?: boolean;
  trends?: boolean;
}) {
  const t = useTranslations("nav");
  return (
    <AccountHeader
      identityTitle={trends ? t("trends") : undefined}
      transactionContext={
        transactions || trends ? (
          <TransactionSpaceBadge group name={name}>
            {id && groups.length > 1 ? (
              <GroupChooser
                labeled
                id={id}
                name={name}
                groups={groups}
                disabled={disabled}
                onChange={onChange}
              />
            ) : undefined}
          </TransactionSpaceBadge>
        ) : undefined
      }
      ledgerContext={
        <div className="flex min-w-0 items-center gap-1">
          {groups.length <= 1 && <LedgerContextLabel group name={name} />}
          {id && (
            <GroupChooser
              labeled
              id={id}
              name={name}
              groups={groups}
              disabled={disabled}
              onChange={onChange}
            />
          )}
        </div>
      }
    />
  );
}
