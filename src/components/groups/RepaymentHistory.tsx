"use client";
import { canRecordRepayment } from "@/lib/groups/repayment-permissions";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { Select } from "@/components/ui/Select";
import { useGroupConfirmation } from "./useGroupConfirmation";
import { useSettlementDirty } from "./useSettlementDirty";
import { formatMoney } from "@/lib/format";
import type { GroupRepayment } from "@/lib/groups/dto";
import type { GroupSnapshot, GroupOperationRunner } from "./settlement-types";
import { Field, Panel, GroupDialog, buttonClass, inputClass, primaryClass } from "./ui";

export function RepaymentHistory({
  data,
  run,
  busy,
  onDirtyChange,
}: {
  data: GroupSnapshot;
  run: GroupOperationRunner;
  busy: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const t = useTranslations("groups");
  const locale = useStore((s) => s.locale);
  const [reversing, setReversing] = useState<GroupRepayment | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [participant, setParticipant] = useState("");
  const [status, setStatus] = useState("all");
  const [limit, setLimit] = useState(20);
  const { confirm, confirmation } = useGroupConfirmation();
  useSettlementDirty(!!reversing && !!reason, onDirtyChange);
  const close = async () => {
    if (!busy && (!reason || (await confirm(t("splitDiscardDraft"))))) setReversing(null);
  };
  const history = [...data.repayments]
    .filter(
      (r) =>
        (!participant || r.senderId === participant || r.recipientId === participant) &&
        (status === "all" || (status === "reversed" ? !!r.reversedAt : !r.reversedAt)),
    )
    .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn) || a.id.localeCompare(b.id));
  const name = (id: string) => data.members.find((m) => m.id === id)?.name ?? t("formerMember");
  return (
    <Panel tone="butter">
      <h2 className="font-bold">{t("paymentHistory")}</h2>
      <p className="mt-1 text-meta text-muted">{t("splitAllDates")}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Select
          className={inputClass}
          value={participant}
          aria-label={t("participants")}
          onChange={(e) => {
            setParticipant(e.target.value);
            setLimit(20);
          }}
        >
          <option value="">{t("allMembers")}</option>
          {data.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {m.status !== "active" ? ` (${t("formerMember")})` : ""}
            </option>
          ))}
        </Select>
        <Select
          className={inputClass}
          value={status}
          aria-label={t("splitPaymentStatus")}
          onChange={(e) => {
            setStatus(e.target.value);
            setLimit(20);
          }}
        >
          <option value="all">{t("splitAllPayments")}</option>
          <option value="recorded">{t("splitPaymentRecorded")}</option>
          <option value="reversed">{t("reversed")}</option>
        </Select>
      </div>
      <div className="mt-3 divide-y divide-edge">
        {history.slice(0, limit).map((r) => (
          <div
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"
          >
            <div>
              <p className="font-semibold">
                {name(r.senderId)} → {name(r.recipientId)} ·{" "}
                {formatMoney(r.amountCents, { locale })}
              </p>
              <p className="mt-1 text-xs text-muted">
                {r.occurredOn} · {t("recordedBy")} {name(r.recordedBy)}·{" "}
                {t(r.reversedAt ? "reversed" : "splitPaymentRecorded")}
              </p>
              {r.note && <p className="mt-1 text-xs text-muted">{r.note}</p>}
              {r.reversalReason && <p className="mt-1 text-xs text-muted">{r.reversalReason}</p>}
            </div>
            {!r.reversedAt && !data.group.archivedAt && canRecordRepayment(data.group) && (
              <button
                className={buttonClass}
                disabled={busy}
                onClick={() => {
                  setReversing(r);
                  setReason("");
                  setError("");
                }}
              >
                {t("reverse")}
              </button>
            )}
          </div>
        ))}
      </div>
      {!history.length && (
        <p className="mt-4 text-body text-muted">
          {t(data.repayments.length ? "noEntries" : "noPayments")}
        </p>
      )}
      {history.length > limit && (
        <button
          type="button"
          className={`${buttonClass} mt-3`}
          onClick={() => setLimit((old) => old + 20)}
        >
          {t("splitShowMore")}
        </button>
      )}
      {reversing && (
        <GroupDialog
          title={t("reverse")}
          width={440}
          onClose={() => {
            void close();
          }}
        >
          <form
            className="mt-4 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy || !reason.trim() || !canRecordRepayment(data.group)) return;
              try {
                const result = await run({
                  type: "reverse",
                  id: reversing.id,
                  reason: reason.trim(),
                });
                if (result) setReversing(null);
              } catch (e) {
                setError(e instanceof Error ? e.message : t("failed"));
              }
            }}
          >
            <p className="text-sm font-semibold">
              {name(reversing.senderId)} → {name(reversing.recipientId)} ·{" "}
              {formatMoney(reversing.amountCents, { locale })}
            </p>
            <p className="text-meta text-muted">{t("splitReversalHint")}</p>
            <Field label={t("reverseReason")}>
              <textarea
                required
                maxLength={300}
                rows={3}
                className={inputClass}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={buttonClass}
                disabled={busy}
                onClick={() => {
                  void close();
                }}
              >
                {t("cancel")}
              </button>
              <button className={primaryClass} disabled={busy || !reason.trim()}>
                {t("reverse")}
              </button>
            </div>
          </form>
        </GroupDialog>
      )}
      {confirmation}
    </Panel>
  );
}
