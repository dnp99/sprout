"use client";

import { groupToday } from "@/lib/groups/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { formatMoney, parseMoneyInput } from "@/lib/format";
import type { GroupSnapshot } from "@/lib/groups/dto";
import type { GroupOperation } from "@/lib/groups/validation";
import { GroupApiError } from "@/state/groups";
import { Field, Panel, inputClass, buttonClass, primaryClass } from "./ui";

/** Actual repayments affect obligations independently of household spending. */
export function GroupSettlements({
  data,
  run,
  busy,
}: {
  data: GroupSnapshot;
  run: (op: GroupOperation) => Promise<unknown>;
  busy: boolean;
}) {
  const t = useTranslations("groups"),
    locale = useStore((s) => s.locale),
    [sender, setSender] = useState(data.group.memberId),
    [recipient, setRecipient] = useState(
      data.members.find((m) => m.id !== data.group.memberId)?.id ?? "",
    ),
    [amount, setAmount] = useState(""),
    [date, setDate] = useState(groupToday()),
    [note, setNote] = useState(""),
    [reason, setReason] = useState(""),
    [duplicates, setDuplicates] = useState<string[]>([]),
    [acknowledged, setAcknowledged] = useState(false),
    [error, setError] = useState("");
  const name = (id: string) => data.members.find((m) => m.id === id)?.name ?? t("formerMember");
  const canRecord =
    data.group.role === "owner" ||
    sender === data.group.memberId ||
    recipient === data.group.memberId;
  const money = (n: number) => formatMoney(n, { locale });
  const save = async () => {
    try {
      const cents = parseMoneyInput(amount, locale);
      if (!cents || cents <= 0) throw new Error(t("validAmount"));
      if (duplicates.length && !acknowledged) throw new Error(t("duplicateHint"));
      await run({
        type: "repayment",
        senderId: sender,
        recipientId: recipient,
        amountCents: cents,
        occurredOn: date,
        note,
        reason,
        duplicateIds: acknowledged ? duplicates : [],
      });
      setAmount("");
      setNote("");
      setDuplicates([]);
      setAcknowledged(false);
      setError("");
    } catch (e) {
      if (e instanceof GroupApiError && e.details?.duplicateIds) {
        setDuplicates(e.details.duplicateIds);
        setAcknowledged(false);
      }
      setError(e instanceof Error ? e.message : t("failed"));
    }
  };
  return (
    <div className="space-y-4">
      <Panel>
        <h2 className="font-bold">{t("balances")}</h2>
        <p className="mt-2 text-xs text-muted">{t("balanceHint")}</p>
        <div className="mt-4 divide-y divide-edge">
          {data.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <span>
                {m.name}
                {m.status !== "active" ? ` (${t("formerMember")})` : ""}
              </span>
              <strong className="tabular-nums">{money(data.balances[m.id] ?? 0)}</strong>
            </div>
          ))}
        </div>
        <h3 className="mt-4 font-semibold">{t("suggestions")}</h3>
        {data.transfers.map((x, i) => (
          <p className="mt-2 text-sm" key={i}>
            {name(x.from)} → {name(x.to)} · {money(x.amountCents)}
          </p>
        ))}
        {!data.transfers.length && <p className="mt-2 text-sm text-muted">{t("allSettled")}</p>}
      </Panel>
      {!data.group.archivedAt && (
        <Panel>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <h2 className="font-bold">{t("recordPayment")}</h2>
            <p className="text-xs text-muted">{t("immediateHint")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("sender")}>
                <select
                  className={inputClass}
                  value={sender}
                  onChange={(e) => {
                    setSender(e.target.value);
                    setDuplicates([]);
                  }}
                >
                  {data.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("recipient")}>
                <select
                  className={inputClass}
                  value={recipient}
                  onChange={(e) => {
                    setRecipient(e.target.value);
                    setDuplicates([]);
                  }}
                >
                  <option value="">{t("chooseMember")}</option>
                  {data.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("amount")}>
                <input
                  required
                  className={inputClass}
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setDuplicates([]);
                  }}
                />
              </Field>
              <Field label={t("date")}>
                <input
                  required
                  type="date"
                  className={inputClass}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setDuplicates([]);
                  }}
                />
              </Field>
            </div>
            <Field label={t("note")}>
              <input
                maxLength={1000}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={inputClass}
              />
            </Field>
            {data.group.role === "owner" && (
              <Field label={t("overrideReason")}>
                <input
                  maxLength={300}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={inputClass}
                />
              </Field>
            )}
            {duplicates.length > 0 && (
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                />
                {t("duplicateHint")}
              </label>
            )}
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            <button className={primaryClass} disabled={busy || !canRecord || sender === recipient}>
              {t("recordPayment")}
            </button>
          </form>
        </Panel>
      )}
      <Panel>
        <h2 className="font-bold">{t("paymentHistory")}</h2>
        <div className="divide-y divide-edge">
          {data.repayments.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"
            >
              <div>
                <strong>
                  {name(r.senderId)} → {name(r.recipientId)} · {money(r.amountCents)}
                </strong>
                <p className="mt-1 text-xs text-muted">
                  {r.occurredOn} · {t("recordedBy")} {name(r.recordedBy)}
                  {r.reversedAt ? ` · ${t("reversed")}` : ""}
                </p>
                {r.reversalReason && <p className="mt-1 text-xs text-muted">{r.reversalReason}</p>}
              </div>
              {!r.reversedAt &&
                !data.group.archivedAt &&
                (data.group.role === "owner" ||
                  [r.senderId, r.recipientId].includes(data.group.memberId)) && (
                  <button
                    className={buttonClass}
                    disabled={busy}
                    onClick={async () => {
                      const explanation = window.prompt(t("reverseReason"));
                      if (!explanation?.trim()) return;
                      try {
                        await run({ type: "reverse", id: r.id, reason: explanation });
                        setError("");
                      } catch (e) {
                        setError(e instanceof Error ? e.message : t("failed"));
                      }
                    }}
                  >
                    {t("reverse")}
                  </button>
                )}
            </div>
          ))}
        </div>
        {!data.repayments.length && <p className="mt-3 text-sm text-muted">{t("noPayments")}</p>}
      </Panel>
    </div>
  );
}
