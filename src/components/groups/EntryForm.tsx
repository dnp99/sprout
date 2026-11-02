"use client";

import { transactionRequiredIssues } from "@/lib/transactions/requirements";
import { appendAmountKey } from "@/lib/amount-entry";
import { groupCategoryLabel, orderGroupCategories } from "@/lib/groups/category-tree";
import { Select } from "@/components/ui/Select";

import { groupToday } from "@/lib/groups/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { savedSplit } from "@/lib/groups/split";
import type { GroupSnapshot, GroupEntry } from "@/lib/groups/dto";
import type { GroupOperation } from "@/lib/groups/validation";
import { buttonClass } from "./ui";
import {
  TransactionEntryFields,
  TransactionEntryForm,
  TransactionField as Field,
  transactionInputClass as entryInputClass,
} from "@/components/shared/TransactionEntryForm";

type Run = (op: GroupOperation) => Promise<{ id?: string; token?: string } | null>;
/** Original drafts are saved independently; financial edits may queue split review. */
export function EntryForm({
  data,
  existing,
  refund,
  run,
  busy,
  onDone,
  initialDate,
  onRefund,
}: {
  data: GroupSnapshot;
  existing: GroupEntry | null;
  refund: GroupEntry | null;
  run: Run;
  busy: boolean;
  onDone: () => void;
  initialDate?: string;
  onRefund?: (entry: GroupEntry) => void;
}) {
  const requiredText = useTranslations("transactionRequirements");
  const t = useTranslations("groups"),
    [kind, setKind] = useState(existing?.kind ?? (refund ? "refund" : "expense"));
  const [cents, setCents] = useState(existing ? Math.abs(existing.amountCents) : 0),
    [merchant, setMerchant] = useState(existing?.merchant ?? refund?.merchant ?? ""),
    [note, setNote] = useState(existing?.note ?? ""),
    [date, setDate] = useState(existing?.occurredOn ?? initialDate ?? groupToday());
  const [payer, setPayer] = useState(existing ? (existing.payerId ?? "") : data.group.memberId),
    [category, setCategory] = useState(existing?.categoryId ?? refund?.categoryId ?? "");
  const settlement = existing?.settlement ?? true;
  const [includeNextSplit, setIncludeNextSplit] = useState(true);
  const [reason, setReason] = useState(""),
    [error, setError] = useState("");
  const memberOptions = data.members.filter(
    (m) =>
      m.status === "active" ||
      m.id === existing?.payerId ||
      existing?.shares.some((s) => s.memberId === m.id),
  );
  const splitChanged =
    existing &&
    savedSplit(existing) &&
    (cents !== Math.abs(existing.amountCents) ||
      category !== (existing.categoryId ?? "") ||
      payer !== (existing.payerId ?? "") ||
      date !== existing.occurredOn ||
      settlement !== existing.settlement);
  const save = async () => {
    if (busy || data.group.archivedAt) return;
    setError("");
    const issues = transactionRequiredIssues({ amountCents: cents, categoryId: category });
    // Shared fields render required errors beside their controls.
    if (!existing && issues.length) return;
    if (!cents || cents < 0) {
      setError(t("validAmount"));
      return;
    }
    try {
      const result = await run({
        type: "entry",
        entry: {
          id: existing?.id,
          version: existing?.version,
          kind: kind as "expense" | "income" | "refund",
          amountCents: cents,
          merchant,
          note,
          occurredOn: date,
          categoryId: category || null,
          payerId: payer || null,
          refundOf: refund?.id ?? existing?.refundOf ?? null,
          settlement: settlement && !!payer,
          splitMethod: (existing?.splitMethod ?? "equal") as "equal" | "percentage",
          participants: [],
          includeNextSplit,
          reason,
        },
      });
      if (result) onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
    }
  };
  return (
    <TransactionEntryForm
      onSubmit={() => {
        void save();
      }}
      disabled={
        busy ||
        !cents ||
        (!existing &&
          transactionRequiredIssues({ amountCents: cents, categoryId: category }).length > 0) ||
        !!data.group.archivedAt
      }
      busy={busy}
      editing={!!existing}
      error={error}
      secondaryActions={
        <>
          {existing?.kind === "expense" && onRefund && (
            <button
              type="button"
              className={`${buttonClass} lg:hidden`}
              disabled={busy || !!data.group.archivedAt}
              onClick={() => onRefund(existing)}
            >
              {t("refund")}
            </button>
          )}
          {existing && (
            <button
              type="button"
              disabled={busy || !!data.group.archivedAt}
              className={buttonClass + " text-danger"}
              onClick={async () => {
                try {
                  await run({
                    type: "void",
                    id: existing.id,
                    version: existing.version,
                    reason: reason || t("void"),
                  });
                  onDone();
                } catch (e) {
                  setError(e instanceof Error ? e.message : t("failed"));
                }
              }}
            >
              {t("void")}
            </button>
          )}
        </>
      }
    >
      <TransactionEntryFields
        amountCents={cents}
        income={kind === "income"}
        onAmountKey={(key) => setCents((value) => appendAmountKey(value, key))}
        onAmountChange={setCents}
        merchant={merchant}
        onMerchantChange={setMerchant}
        date={date}
        onDateChange={setDate}
        categoryId={category}
        onCategoryChange={setCategory}
        categoryRequired={!existing}
        categoryDisabled={kind === "refund"}
        categories={orderGroupCategories(data.categories)
          .filter((c) => !c.archived || c.id === category)
          .map((c) => ({
            id: c.id,
            name: groupCategoryLabel(data.categories, c.id),
            emoji: c.emoji,
          }))}
        note={note}
        onNoteChange={setNote}
        noteMaxLength={1000}
        mode={kind}
        modeOptions={
          !existing && !refund
            ? [
                { value: "expense", label: t("expense") },
                { value: "income", label: t("income") },
              ]
            : undefined
        }
        onModeChange={(value) => setKind(value as typeof kind)}
        notice={
          <>
            {(refund || kind === "refund") && (
              <p className="rounded-[10px] bg-track p-3 text-sm text-muted">{t("refundHint")}</p>
            )}
            {refund && !category && (
              <p role="alert" className="text-xs text-danger">
                {requiredText("refundCategory")}
              </p>
            )}
          </>
        }
        afterFields={
          <>
            {existing && (
              <Field label={t("voidReason")}>
                <input
                  value={reason}
                  maxLength={300}
                  onChange={(e) => setReason(e.target.value)}
                  className={entryInputClass}
                />
              </Field>
            )}
          </>
        }
      >
        <Field label={t(kind === "expense" ? "paidBy" : "receivedBy")}>
          <Select
            aria-label={t(kind === "expense" ? "paidBy" : "receivedBy")}
            value={payer}
            onChange={(e) => setPayer(e.target.value)}
            className={entryInputClass}
          >
            <option value="">{t("sharedFunds")}</option>
            {memberOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.status !== "active" ? ` (${t("formerMember")})` : ""}
              </option>
            ))}
          </Select>
        </Field>
        {splitChanged && (
          <div className="rounded-[10px] bg-track p-3">
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={includeNextSplit}
                onChange={(e) => setIncludeNextSplit(e.target.checked)}
              />
              {t("includeNextSplit")}
            </label>
            <p className="mt-1 text-xs text-muted">{t("includeNextSplitHint")}</p>
          </div>
        )}
      </TransactionEntryFields>
    </TransactionEntryForm>
  );
}
