"use client";
import { canRecordRepayment } from "@/lib/groups/repayment-permissions";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { formatMoney } from "@/lib/format";
import type { GroupSnapshot, SuggestedRepayment } from "./settlement-types";
import { Panel, buttonClass, primaryClass } from "./ui";

/** The headline describes saved, all-time debt; selecting a split period never changes it. */
export function SettlementBalances({
  data,
  busy,
  onRecord,
}: {
  data: GroupSnapshot;
  busy: boolean;
  onRecord: (payment: SuggestedRepayment | null) => void;
}) {
  const t = useTranslations("groups");
  const locale = useStore((s) => s.locale);
  const money = (cents: number) => formatMoney(Math.abs(cents), { locale });
  const own = data.balances[data.group.memberId] ?? 0;
  const name = (id: string) => data.members.find((m) => m.id === id)?.name ?? t("formerMember");
  return (
    <Panel tone="mint">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-muted">{t("savedBalance")}</p>
          <h2 className="mt-2 text-[24px] font-bold tabular-nums">
            {own
              ? t(own > 0 ? "youAreOwed" : "youOwe", { amount: money(own) })
              : t("yourBalanceSettled")}
          </h2>
          <p className="mt-2 max-w-xl text-xs text-muted">{t("savedBalanceHint")}</p>
        </div>
        {!data.group.archivedAt && (
          <button
            className={buttonClass}
            disabled={busy || data.members.length < 2}
            onClick={() => onRecord(null)}
          >
            {t("recordPayment")}
          </button>
        )}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {data.transfers.map((x) => {
          const canRecord = canRecordRepayment(data.group);
          const label =
            x.from === data.group.memberId
              ? t("youOweMember", { name: name(x.to), amount: money(x.amountCents) })
              : x.to === data.group.memberId
                ? t("memberOwesYou", { name: name(x.from), amount: money(x.amountCents) })
                : t("memberOwesMember", {
                    from: name(x.from),
                    to: name(x.to),
                    amount: money(x.amountCents),
                  });
          return (
            <div
              key={`${x.from}:${x.to}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-edge bg-card p-4"
            >
              <p className="min-w-0 text-sm font-semibold">{label}</p>
              {canRecord && !data.group.archivedAt && (
                <button className={primaryClass} disabled={busy} onClick={() => onRecord(x)}>
                  {t("recordPayment")}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {!data.transfers.length && <p className="mt-4 text-sm text-muted">{t("allSettled")}</p>}
      <details className="mt-5 border-t border-edge pt-3">
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 text-sm font-semibold">
          {t("balances")}
          <ChevronDown size={16} strokeWidth={2} aria-hidden />
        </summary>
        {data.members.map((m) => {
          const amount = data.balances[m.id] ?? 0;
          return (
            <div key={m.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
              <span>
                {m.name}
                {m.status !== "active" ? ` (${t("formerMember")})` : ""}
              </span>
              <span className="tabular-nums text-muted">
                {amount
                  ? t(amount > 0 ? "memberIsOwed" : "memberOwes", { amount: money(amount) })
                  : t("settledLabel")}
              </span>
            </div>
          );
        })}
      </details>
    </Panel>
  );
}
