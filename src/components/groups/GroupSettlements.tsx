"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { GroupSplitWorkspace } from "./GroupSplitWorkspace";
import { SettlementBalances } from "./SettlementBalances";
import { SettlementTransfers } from "./SettlementTransfers";
import { RepaymentDialog } from "./RepaymentDialog";
import { RepaymentHistory } from "./RepaymentHistory";
import { useSettlementDirty } from "./useSettlementDirty";
import type { GroupSnapshot, GroupOperationRunner, SuggestedRepayment } from "./settlement-types";

/** View switches retain drafts. Date selection belongs only to Split expenses;
 * saved balances and actual payments always describe all dates. */
export function GroupSettlements({
  data,
  month,
  run,
  busy,
  onDirtyChange,
}: {
  data: GroupSnapshot;
  month: string;
  run: GroupOperationRunner;
  busy: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const t = useTranslations("groups");
  const [view, setView] = useState("split");
  const [attention, setAttention] = useState(false);
  const [payment, setPayment] = useState<SuggestedRepayment | null | undefined>();
  const [splitDirty, setSplitDirty] = useState(false);
  const [rulesDirty, setRulesDirty] = useState(false);
  const [paymentDirty, setPaymentDirty] = useState(false);
  const [reversalDirty, setReversalDirty] = useState(false);
  useSettlementDirty(splitDirty || rulesDirty || paymentDirty || reversalDirty, onDirtyChange);
  const workspace = useRef<HTMLDivElement>(null);
  return (
    <div className="settlement-workspace space-y-4">
      <SettlementBalances
        data={data}
        busy={busy}
        onReview={() => {
          setView("split");
          setAttention(true);
          workspace.current?.scrollIntoView?.({ block: "start" });
        }}
        onPayments={() => setView("payments")}
      />
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
      <div ref={workspace}>
        {/* Hidden views stay mounted: changing tasks must not discard decisions. */}
        <div hidden={view !== "split"}>
          <GroupSplitWorkspace
            data={data}
            month={month}
            run={run}
            busy={busy}
            attention={attention}
            onReturn={() => setAttention(false)}
            onDirtyChange={setSplitDirty}
            onRulesDirtyChange={setRulesDirty}
          />
        </div>
        <div hidden={view !== "payments"} className="split-workspace">
          <aside className="split-support">
            <SettlementTransfers data={data} busy={busy} onRecord={setPayment} />
          </aside>
          <div className="split-main min-w-0">
            <RepaymentHistory data={data} run={run} busy={busy} onDirtyChange={setReversalDirty} />
          </div>
        </div>
      </div>
      {payment !== undefined && (
        <RepaymentDialog
          data={data}
          run={run}
          busy={busy}
          initial={payment}
          onDone={() => setPayment(undefined)}
          onDirtyChange={setPaymentDirty}
        />
      )}
    </div>
  );
}
