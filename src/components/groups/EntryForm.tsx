"use client";

import { AmountCalculator } from "@/components/shared/AmountCalculator";
import { AmountEntry } from "@/components/shared/AmountEntry";
import { SegmentedControl } from "@/components/ui/controls";
import { LoaderCircle } from "lucide-react";
import { appendAmountKey } from "@/lib/amount-entry";
import { groupCategoryLabel, orderGroupCategories } from "@/lib/groups/category-tree";
import { Select } from "@/components/ui/Select";

import { groupToday } from "@/lib/groups/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { formatMoney } from "@/lib/format";
import { savedSplit } from "@/lib/groups/split";
import type { GroupSnapshot, GroupEntry } from "@/lib/groups/dto";
import type { GroupOperation } from "@/lib/groups/validation";
import { buttonClass, primaryClass, inputClass, Field } from "./ui";

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
}: {
  data: GroupSnapshot;
  existing: GroupEntry | null;
  refund: GroupEntry | null;
  run: Run;
  busy: boolean;
  onDone: () => void;
  initialDate?: string;
}) {
  const t = useTranslations("groups"),
    locale = useStore((s) => s.locale),
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
    <form
      className="mt-5 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <div
        className={`flex justify-center py-3 text-[42px] font-bold tracking-tight tabular-nums sm:text-[46px] ${kind === "income" ? "text-green" : "text-primary"}`}
      >
        <AmountEntry
          label={t("amount")}
          display={formatMoney(cents, { forceCents: true, signed: kind === "income", locale })}
          onKey={(key) => setCents((value) => appendAmountKey(value, key))}
        />
      </div>
      <AmountCalculator cents={cents} onApply={setCents}>
        <input
          aria-label={t("merchant")}
          placeholder={t("merchant")}
          maxLength={120}
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          className="min-h-11 w-full rounded-[14px] border border-edge bg-card px-4 py-3 text-[16px] font-medium text-ink outline-none placeholder:text-muted focus:border-primary lg:text-[14px]"
        />
      </AmountCalculator>
      {!existing && !refund && (
        <SegmentedControl
          options={[
            { value: "expense", label: t("expense") },
            { value: "income", label: t("income") },
          ]}
          value={kind}
          onChange={setKind}
        />
      )}
      {(refund || kind === "refund") && (
        <p className="rounded-[10px] bg-track p-3 text-sm text-muted">{t("refundHint")}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("date")}>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label={t("category")}>
          <Select
            aria-label={t("category")}
            value={category}
            disabled={kind === "refund"}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            <option value="">{t("uncategorized")}</option>
            {orderGroupCategories(data.categories)
              .filter((c) => !c.archived || c.id === category)
              .map((c) => (
                <option data-icon={c.emoji} key={c.id} value={c.id}>
                  {groupCategoryLabel(data.categories, c.id)}
                </option>
              ))}
          </Select>
        </Field>
      </div>
      <Field label={t(kind === "expense" ? "paidBy" : "receivedBy")}>
        <Select
          aria-label={t(kind === "expense" ? "paidBy" : "receivedBy")}
          value={payer}
          onChange={(e) => setPayer(e.target.value)}
          className={inputClass}
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
      <Field label={t("note")}>
        <textarea
          value={note}
          rows={2}
          maxLength={1000}
          onChange={(e) => setNote(e.target.value)}
          className={inputClass}
        />
      </Field>
      {existing && (data.group.role === "owner" || existing.authorId === data.group.memberId) && (
        <Field label={t("voidReason")}>
          <input
            value={reason}
            maxLength={300}
            onChange={(e) => setReason(e.target.value)}
            className={inputClass}
          />
        </Field>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="sticky bottom-0 flex flex-wrap gap-3 border-t border-edge bg-card pt-3">
        <button
          disabled={busy || !cents || !!data.group.archivedAt}
          className={primaryClass + " flex-1 py-3 text-[14px]"}
        >
          {busy && <LoaderCircle size={16} className="animate-spin" aria-hidden />}
          {t("save")}
        </button>
        {existing && (data.group.role === "owner" || existing.authorId === data.group.memberId) && (
          <button
            type="button"
            disabled={busy || (existing.authorId !== data.group.memberId && !reason.trim())}
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
      </div>
    </form>
  );
}
