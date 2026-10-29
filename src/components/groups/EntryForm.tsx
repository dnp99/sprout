"use client";
import { useGroupConfirmation } from "./useGroupConfirmation";

import { orderGroupCategories, groupCategoryLabel } from "@/lib/groups/category-tree";

import { resolveGroupSplit, splitDraft } from "@/lib/groups/splits";
import { PercentageInput } from "./PercentageInput";

import { AmountCalculator } from "@/components/shared/AmountCalculator";
import { Select } from "@/components/ui/Select";

import { groupToday } from "@/lib/groups/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { formatBudgetInput, formatMoney, parseMoneyInput } from "@/lib/format";
import { allocate } from "@/lib/groups/accounting";
import type { GroupSnapshot, GroupEntry } from "@/lib/groups/dto";
import type { GroupOperation } from "@/lib/groups/validation";
import { buttonClass, primaryClass, inputClass, Field } from "./ui";

type Run = (op: GroupOperation) => Promise<{ id?: string; token?: string } | null>;
/** Local draft stays intact on validation/conflict; preview and server use the same allocator. */
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
  const { confirm, confirmation } = useGroupConfirmation();
  const t = useTranslations("groups"),
    locale = useStore((s) => s.locale),
    [kind, setKind] = useState(existing?.kind ?? (refund ? "refund" : "expense"));
  const [amount, setAmount] = useState(
      existing ? formatBudgetInput(Math.abs(existing.amountCents), locale) : "",
    ),
    [merchant, setMerchant] = useState(existing?.merchant ?? refund?.merchant ?? ""),
    [note, setNote] = useState(existing?.note ?? ""),
    [date, setDate] = useState(existing?.occurredOn ?? initialDate ?? groupToday());
  const [payer, setPayer] = useState(existing ? (existing.payerId ?? "") : data.group.memberId),
    [category, setCategory] = useState(existing?.categoryId ?? refund?.categoryId ?? ""),
    [settlement, setSettlement] = useState(existing?.settlement ?? true),
    [method, setMethod] = useState(
      existing?.splitMethod ??
        splitDraft(resolveGroupSplit(data, existing?.categoryId ?? null), data.members).method,
    );
  const [participants, setParticipants] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      existing?.shares.length
        ? existing.shares.map((s) => [s.memberId, String(s.weight / 100)])
        : Object.entries(
            splitDraft(resolveGroupSplit(data, existing?.categoryId ?? null), data.members)
              .participants,
          ),
    ),
  );
  const [reason, setReason] = useState(""),
    [error, setError] = useState("");
  const memberOptions = data.members.filter(
    (m) =>
      m.status === "active" ||
      m.id === existing?.payerId ||
      existing?.shares.some((s) => s.memberId === m.id),
  );
  const cents = parseMoneyInput(amount, locale),
    weights = Object.entries(participants).map(([memberId, value]) => ({
      memberId,
      weight: method === "equal" ? 1 : Math.round(Number(value) * 100),
    }));
  let preview: ReturnType<typeof allocate> = [];
  try {
    if (
      cents &&
      weights.length &&
      (method === "equal" || weights.reduce((n, p) => n + p.weight, 0) === 10000)
    )
      preview = allocate(cents, weights);
  } catch {}
  const applySplit = (categoryId: string) => {
    const draft = splitDraft(resolveGroupSplit(data, categoryId || null), data.members);
    setMethod(draft.method);
    setParticipants(draft.participants);
  };
  const save = async () => {
    setError("");
    if (!cents || cents < 0) {
      setError(t("validAmount"));
      return;
    }
    if (existing && !(await confirm(t("editConfirm")))) return;
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
          splitMethod: method as "equal" | "percentage",
          participants: weights,
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
      {confirmation}
      {!existing && !refund && !resolveGroupSplit(data, category || null).valid && (
        <p className="text-xs text-danger">{t("defaultsInvalid")}</p>
      )}
      {!existing && !refund && (
        <Field label={t("type")}>
          <Select
            aria-label={t("type")}
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className={inputClass}
          >
            <option value="expense">{t("expense")}</option>
            <option value="income">{t("income")}</option>
          </Select>
        </Field>
      )}
      {refund && <p className="rounded-[10px] bg-track p-3 text-sm">{t("refundHint")}</p>}
      <Field label={t("amount")}>
        <input
          required
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={inputClass}
        />
      </Field>
      <AmountCalculator
        cents={cents ?? 0}
        onApply={(value) => setAmount(formatBudgetInput(value, locale))}
      />
      <Field label={t("merchant")}>
        <input
          maxLength={120}
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          className={inputClass}
        />
      </Field>
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
            onChange={(e) => {
              setCategory(e.target.value);
              // New drafts follow category defaults; edits preserve the saved allocation.
              if (!existing && !refund) applySplit(e.target.value);
            }}
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
      {kind === "expense" && (
        <>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={settlement && !!payer}
              disabled={!payer}
              onChange={(e) => setSettlement(e.target.checked)}
            />
            {t("includeSettlement")}
          </label>
          <Field label={t("splitMethod")}>
            <Select
              aria-label={t("splitMethod")}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className={inputClass}
            >
              <option value="equal">{t("equal")}</option>
              <option value="percentage">{t("percentage")}</option>
            </Select>
          </Field>
          <button
            type="button"
            disabled={busy}
            className={buttonClass}
            onClick={() => applySplit(category)}
          >
            {t("applyCategorySplit")}
          </button>
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold">{t("participants")}</legend>
            {memberOptions.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <label className="flex min-h-11 flex-1 items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={m.id in participants}
                    onChange={(e) =>
                      setParticipants((p) => {
                        const next = { ...p };
                        if (e.target.checked) next[m.id] = "0";
                        else delete next[m.id];
                        return next;
                      })
                    }
                  />
                  {m.name}
                </label>
                {method === "percentage" && m.id in participants && (
                  <PercentageInput
                    aria-label={t("percentFor", { name: m.name })}
                    className="w-24 shrink-0"
                    value={participants[m.id]}
                    onChange={(e) => setParticipants((p) => ({ ...p, [m.id]: e.target.value }))}
                  />
                )}
                <span className="min-w-16 text-right text-sm tabular-nums">
                  {formatMoney(preview.find((s) => s.memberId === m.id)?.amountCents ?? 0, {
                    locale,
                  })}
                </span>
              </div>
            ))}
          </fieldset>
          {!preview.length && <p className="text-xs text-danger">{t("splitHint")}</p>}
        </>
      )}
      <Field label={t("note")}>
        <textarea
          value={note}
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
        <button disabled={busy || !!data.group.archivedAt} className={primaryClass}>
          {t("save")}
        </button>
        {existing && (data.group.role === "owner" || existing.authorId === data.group.memberId) && (
          <button
            type="button"
            disabled={busy || !reason}
            className={buttonClass + " text-danger"}
            onClick={async () => {
              if (!(await confirm(t("voidConfirm")))) return;
              try {
                await run({ type: "void", id: existing.id, version: existing.version, reason });
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
