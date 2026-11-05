"use client";
import { canRecordRepayment } from "@/lib/groups/repayment-permissions";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { formatBudgetInput, formatMoney, parseMoneyInput } from "@/lib/format";
import { groupToday } from "@/lib/groups/navigation";
import { GroupApiError } from "@/state/groups";
import type { GroupSnapshot, GroupOperationRunner, SuggestedRepayment } from "./settlement-types";
import { useSettlementDirty } from "./useSettlementDirty";
import { useGroupConfirmation } from "./useGroupConfirmation";
import { Field, GroupDialog, inputClass, primaryClass } from "./ui";

/** Suggestions initialize drafts only. Recording confirms an actual past
 * payment and never initiates a transfer or changes the original expenses. */
export function RepaymentDialog({
  data,
  run,
  busy,
  initial,
  onDone,
  onDirtyChange,
}: {
  data: GroupSnapshot;
  run: GroupOperationRunner;
  busy: boolean;
  initial: SuggestedRepayment | null;
  onDone: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const t = useTranslations("groups");
  const locale = useStore((s) => s.locale);
  const [base] = useState(() => ({
    sender: initial?.from ?? data.group.memberId,
    recipient: initial?.to ?? data.members.find((m) => m.id !== data.group.memberId)?.id ?? "",
    amount: initial ? formatBudgetInput(initial.amountCents, locale) : "",
    date: groupToday(),
    note: "",
    reason: "",
  }));
  const [draft, setDraft] = useState(base);
  const [duplicates, setDuplicates] = useState<string[]>([]);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState("");
  const { confirm, confirmation } = useGroupConfirmation();
  const dirty = JSON.stringify(draft) !== JSON.stringify(base);
  useSettlementDirty(dirty, onDirtyChange);
  const { sender, recipient, amount, date, note, reason } = draft;
  const cents = parseMoneyInput(amount, locale) ?? 0;
  const canRecord = canRecordRepayment(data.group);
  const needsReason =
    !!sender &&
    !!recipient &&
    ((sender !== data.group.memberId && recipient !== data.group.memberId) ||
      data.members.some((m) => (m.id === sender || m.id === recipient) && m.status !== "active"));
  const memberName = (id: string) => {
    const m = data.members.find((m) => m.id === id);
    return m
      ? `${m.name}${m.status !== "active" ? ` (${t("formerMember")})` : ""}`
      : t("formerMember");
  };
  const valid =
    canRecord &&
    sender !== recipient &&
    !!recipient &&
    !!date &&
    cents > 0 &&
    (!needsReason || !!reason.trim()) &&
    (!duplicates.length || acknowledged);
  const change = (patch: Partial<typeof draft>, resetDuplicates = true) => {
    setDraft((old) => ({ ...old, ...patch }));
    setError("");
    if (resetDuplicates) {
      setDuplicates([]);
      setAcknowledged(false);
    }
  };
  const close = async () => {
    if (!busy && (!dirty || (await confirm(t("splitDiscardDraft"))))) onDone();
  };
  const save = async () => {
    if (busy || !valid) return;
    try {
      const result = await run({
        type: "repayment",
        senderId: sender,
        recipientId: recipient,
        amountCents: cents,
        occurredOn: date,
        note,
        reason: needsReason ? reason.trim() : "",
        duplicateIds: acknowledged ? duplicates : [],
      });
      if (result) onDone();
    } catch (e) {
      if (e instanceof GroupApiError && e.details?.duplicateIds) {
        setDuplicates(e.details.duplicateIds);
        setAcknowledged(false);
      }
      setError(e instanceof Error ? e.message : t("failed"));
    }
  };
  return (
    <>
      <GroupDialog
        title={t("recordPayment")}
        width={480}
        mobileFullScreen
        onClose={() => {
          void close();
        }}
      >
        <form
          className="space-y-4 pt-2"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <fieldset disabled={busy} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("sender")}>
                <Select
                  aria-label={t("sender")}
                  className={inputClass}
                  value={sender}
                  onChange={(e) =>
                    change({
                      sender: e.target.value,
                      ...(e.target.value === recipient ? { recipient: "" } : {}),
                    })
                  }
                >
                  {data.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {memberName(m.id)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("recipient")}>
                <Select
                  required
                  aria-label={t("recipient")}
                  className={inputClass}
                  value={recipient}
                  onChange={(e) => change({ recipient: e.target.value })}
                >
                  <option value="">{t("chooseMember")}</option>
                  {data.members
                    .filter((m) => m.id !== sender)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {memberName(m.id)}
                      </option>
                    ))}
                </Select>
              </Field>
              <Field label={t("amount")}>
                <input
                  aria-label={t("amount")}
                  required
                  className={inputClass}
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => change({ amount: e.target.value })}
                />
              </Field>
              <Field label={t("date")}>
                <input
                  required
                  type="date"
                  className={inputClass}
                  value={date}
                  onChange={(e) => change({ date: e.target.value })}
                />
              </Field>
            </div>
            <Field label={t("note")}>
              <input
                maxLength={1000}
                value={note}
                onChange={(e) => change({ note: e.target.value }, false)}
                className={inputClass}
              />
            </Field>
            {needsReason && (
              <Field label={t("overrideReason")}>
                <input
                  required
                  maxLength={300}
                  value={reason}
                  onChange={(e) => change({ reason: e.target.value }, false)}
                  className={inputClass}
                />
                <span className="text-meta font-normal">{t("splitReasonRequired")}</span>
              </Field>
            )}
            {!recipient && <p className="text-meta text-muted">{t("splitDifferentMembers")}</p>}
            {duplicates.length > 0 && (
              <div className="rounded-[14px] border border-edge bg-track p-3">
                <p className="text-meta font-semibold">{t("splitMatchingPayment")}</p>
                <p className="mt-1 break-words text-body">
                  {memberName(sender)} → {memberName(recipient)} · {formatMoney(cents, { locale })}{" "}
                  · {date}
                </p>
                <div className="mt-2 flex items-start gap-2">
                  <Checkbox
                    label={t("duplicateHint")}
                    checked={acknowledged}
                    onChange={() => setAcknowledged((old) => !old)}
                    className="min-h-11 min-w-11 justify-center"
                  />
                  <p className="pt-2 text-meta">{t("duplicateHint")}</p>
                </div>
              </div>
            )}
            {error && (
              <p role="alert" className="text-body text-danger">
                {error}
              </p>
            )}
            <div className="space-y-3 border-t border-edge pt-3">
              <p className="text-meta text-muted">{t("splitPaymentHint")}</p>
              <button className={`${primaryClass} w-full`} disabled={busy || !valid}>
                {t("recordPayment")}
              </button>
            </div>
          </fieldset>
        </form>
      </GroupDialog>
      {confirmation}
    </>
  );
}
