"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { GroupSplitWorkspace } from "./GroupSplitWorkspace";
import { SettlementBalances } from "./SettlementBalances";
import { RepaymentDialog } from "./RepaymentDialog";
import { RepaymentHistory } from "./RepaymentHistory";
import type { GroupSnapshot, GroupOperationRunner, SuggestedRepayment } from "./settlement-types";

/** Saved balances remain visible while calculations and actual payments have separate workspaces. */
export function GroupSettlements({
  data,
  month,
  run,
  busy,
}: {
  data: GroupSnapshot;
  month: string;
  run: GroupOperationRunner;
  busy: boolean;
}) {
  const t = useTranslations("groups");
  const [view, setView] = useState("split");
  const [payment, setPayment] = useState<SuggestedRepayment | null | undefined>();
  return (
    <div className="space-y-5">
      <SettlementBalances data={data} busy={busy} onRecord={setPayment} />
      <SegmentedControl
        label={`${t("splitView")} / ${t("paymentsView")}`}
        appearance="surface"
        shape="rounded"
        options={[
          { value: "split", label: t("splitView") },
          { value: "payments", label: t("paymentsView") },
        ]}
        value={view}
        onChange={setView}
      />
      {/* Keep review choices alive when switching to payment history. */}
      <div hidden={view !== "split"}>
        <GroupSplitWorkspace data={data} month={month} run={run} busy={busy} />
      </div>
      <div hidden={view !== "payments"}>
        <RepaymentHistory data={data} run={run} busy={busy} />
      </div>
      {payment !== undefined && (
        <RepaymentDialog
          data={data}
          run={run}
          busy={busy}
          initial={payment}
          onDone={() => setPayment(undefined)}
        />
      )}
    </div>
  );
}
