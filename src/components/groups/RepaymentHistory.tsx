"use client";
import { canRecordRepayment } from "@/lib/groups/repayment-permissions";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { formatMoney } from "@/lib/format";
import type { GroupRepayment } from "@/lib/groups/dto";
import type { GroupSnapshot, GroupOperationRunner } from "./settlement-types";
import { Field, Panel, GroupDialog, buttonClass, inputClass, primaryClass } from "./ui";

export function RepaymentHistory({
  data,
  run,
  busy,
}: {
  data: GroupSnapshot;
  run: GroupOperationRunner;
  busy: boolean;
}) {
  const t = useTranslations("groups");
  const locale = useStore((s) => s.locale);
  const [reversing, setReversing] = useState<GroupRepayment | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const name = (id: string) => data.members.find((m) => m.id === id)?.name ?? t("formerMember");
  return (
    <Panel tone="butter">
      <h2 className="font-bold">{t("paymentHistory")}</h2>
      <p className="mt-2 text-xs text-muted">{t("immediateHint")}</p>
      <div className="mt-3 divide-y divide-edge">
        {[...data.repayments]
          .sort((a, b) => b.occurredOn.localeCompare(a.occurredOn) || a.id.localeCompare(b.id))
          .map((r) => (
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
                  {r.occurredOn} · {t("recordedBy")} {name(r.recordedBy)}
                  {r.reversedAt ? ` · ${t("reversed")}` : ""}
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
      {!data.repayments.length && <p className="mt-3 text-sm text-muted">{t("noPayments")}</p>}
      {reversing && (
        <GroupDialog
          title={t("reverse")}
          width={440}
          onClose={() => {
            if (!busy) setReversing(null);
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
                onClick={() => setReversing(null)}
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
    </Panel>
  );
}
