"use client";
import { AccountHeader } from "@/components/shared/AccountHeader";
import { LedgerContextLabel } from "@/components/shared/LedgerContextLabel";
import { GroupChooser } from "./GroupChooser";

/** Mobile group identity belongs to the account header across ledger sections. */
export function GroupAccountHeader({
  id,
  name,
  groups,
  disabled,
  onChange,
}: {
  id?: string;
  name?: string;
  groups: { id: string; name: string }[];
  disabled: boolean;
  onChange: (id: string) => void;
}) {
  return (
    <AccountHeader
      ledgerContext={
        <div className="flex min-w-0 items-center gap-1">
          <LedgerContextLabel group name={name} />
          {id && (
            <GroupChooser
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
