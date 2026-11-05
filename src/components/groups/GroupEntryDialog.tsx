"use client";
import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";
import { TransactionDialog } from "@/components/shared/TransactionEntryForm";
import { EntryForm } from "./EntryForm";
import type { GroupEntry, GroupSnapshot } from "@/lib/groups/dto";

/** The shell retains navigation and mutation state; this boundary owns only
 * composer presentation, so mobile scroll changes cannot alter accounting. */
export function GroupEntryDialog({
  data,
  editing,
  refund,
  run,
  busy,
  onClose,
  onRefund,
  onDone,
}: {
  data: GroupSnapshot;
  editing: GroupEntry | null;
  refund: GroupEntry | null;
  run: ComponentProps<typeof EntryForm>["run"];
  busy: boolean;
  onClose: () => void;
  onRefund: (entry: GroupEntry) => void;
  onDone: () => void;
}) {
  const t = useTranslations("groups");
  const addFlow = useTranslations("addFlow");
  const nav = useTranslations("nav");
  return (
    <TransactionDialog
      groupName={data.group.name}
      title={
        refund ? t("addRefund") : editing ? addFlow("editTransactionModal") : nav("addTransaction")
      }
      onClose={onClose}
    >
      <EntryForm
        key={editing ? `edit:${editing.id}` : refund ? `refund:${refund.id}` : "new"}
        data={data}
        existing={editing}
        refund={refund}
        run={run}
        busy={busy}
        onRefund={onRefund}
        onDone={onDone}
      />
    </TransactionDialog>
  );
}
