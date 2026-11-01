"use client";
import { canRecordRepayment } from "@/lib/groups/repayment-permissions";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { Select } from "@/components/ui/Select";
import { formatBudgetInput, parseMoneyInput } from "@/lib/format";
import { groupToday } from "@/lib/groups/navigation";
import { GroupApiError } from "@/state/groups";
import type { GroupSnapshot, GroupOperationRunner, SuggestedRepayment } from "./settlement-types";
import { Field, GroupDialog, inputClass, primaryClass } from "./ui";

/** A suggested transfer is only a draft; recording never initiates a money transfer. */
export function RepaymentDialog({
  data,
  run,
  busy,
  initial,
  onDone,
}: {
  data: GroupSnapshot;
  run: GroupOperationRunner;
  busy: boolean;
  initial: SuggestedRepayment | null;
  onDone: () => void;
}) {
  const t = useTranslations("groups"),
    locale = useStore((s) => s.locale),
    [sender, setSender] = useState(initial?.from ?? data.group.memberId),
    [recipient, setRecipient] = useState(
      initial?.to ?? data.members.find((m) => m.id !== data.group.memberId)?.id ?? "",
    ),
    [amount, setAmount] = useState(initial ? formatBudgetInput(initial.amountCents, locale) : ""),
    [date, setDate] = useState(groupToday()),
    [note, setNote] = useState(""),
    [reason, setReason] = useState(""),
    [duplicates, setDuplicates] = useState<string[]>([]),
    [acknowledged, setAcknowledged] = useState(false),
    [error, setError] = useState("");
  const canRecord = canRecordRepayment(data.group, sender, recipient);
  const save = async () => {
    if (busy || data.group.archivedAt || !canRecord || sender === recipient || !recipient) return;
    try {
      const cents = parseMoneyInput(amount, locale);
      if (!cents || cents <= 0) throw new Error(t("validAmount"));
      if (duplicates.length && !acknowledged) throw new Error(t("duplicateHint"));
      const result = await run({
        type: "repayment",
        senderId: sender,
        recipientId: recipient,
        amountCents: cents,
        occurredOn: date,
        note,
        reason,
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
    <GroupDialog
      title={t("recordPayment")}
      width={440}
      onClose={() => {
        if (!busy) onDone();
      }}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <fieldset disabled={busy} className="space-y-4">
          <p className="text-xs text-muted">{t("immediateHint")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("sender")}>
              <Select
                aria-label={t("sender")}
                className={inputClass}
                value={sender}
                onChange={(e) => {
                  setSender(e.target.value);
                  setDuplicates([]);
                  setAcknowledged(false);
                }}
              >
                {data.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("recipient")}>
              <Select
                aria-label={t("recipient")}
                className={inputClass}
                value={recipient}
                onChange={(e) => {
                  setRecipient(e.target.value);
                  setDuplicates([]);
                  setAcknowledged(false);
                }}
              >
                <option value="">{t("chooseMember")}</option>
                {data.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
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
                  setAcknowledged(false);
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
                  setAcknowledged(false);
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
          <button
            className={primaryClass + " w-full"}
            disabled={
              busy ||
              !canRecord ||
              sender === recipient ||
              !recipient ||
              (parseMoneyInput(amount, locale) ?? 0) <= 0 ||
              (duplicates.length > 0 && !acknowledged)
            }
          >
            {t("recordPayment")}
          </button>
        </fieldset>
      </form>
    </GroupDialog>
  );
}
