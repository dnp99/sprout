"use client";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { formatMoney } from "@/lib/format";
import { splitRecordStatus, splitWorkspaceFamilies } from "@/lib/groups/split-workspace";
import type { GroupSnapshot } from "./settlement-types";
import { buttonClass } from "./ui";

/** Saved debt and uncalculated records are separate states. A zero balance must
 * never imply that expenses still awaiting a split have been settled. */
export function SettlementBalances({
  data,
  busy,
  onReview,
  onPayments,
}: {
  data: GroupSnapshot;
  busy: boolean;
  onReview: () => void;
  onPayments: () => void;
}) {
  const t = useTranslations("groups");
  const locale = useStore((s) => s.locale);
  const money = (cents: number) => formatMoney(Math.abs(cents), { locale });
  const own = data.balances[data.group.memberId] ?? 0;
  const candidates = [...splitWorkspaceFamilies(data.reportEntries ?? data.entries).keys()];
  const entries = (data.reportEntries ?? data.entries).filter((e) => candidates.includes(e.id));
  const fresh = entries.filter((e) => splitRecordStatus(e) === "new").length;
  const pending = entries.filter((e) => splitRecordStatus(e) === "changed").length;
  return (
    <section className="rounded-[14px] border border-edge bg-card px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="text-meta font-medium text-muted">
            {t("splitSavedBalanceTitle")} · {t("splitAllDates")}
          </p>
          <h2 className="mt-1 text-[22px] font-bold tabular-nums">
            {own
              ? t(own > 0 ? "youAreOwed" : "youOwe", { amount: money(own) })
              : t(fresh || pending ? "splitNoSavedDebt" : "splitSavedSettled")}
          </h2>
        </div>
        {fresh + pending > 0 ? (
          <button className={`${buttonClass} text-left`} disabled={busy} onClick={onReview}>
            <span>
              {t("splitAttentionCounts", { fresh, pending })}
              <span className="block text-meta font-normal text-muted">
                {t("splitReviewAllDates")}
              </span>
            </span>
            <ArrowRight size={16} strokeWidth={2} aria-hidden />
          </button>
        ) : own !== 0 ? (
          <button className={buttonClass} onClick={onPayments}>
            {t("paymentsView")}
            <ArrowRight size={16} strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>
      <details className="mt-2">
        <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 text-meta font-medium text-muted">
          {t("balances")}
          <ChevronDown size={16} strokeWidth={2} aria-hidden />
        </summary>
        <p className="pb-2 text-meta text-muted">{t("savedBalanceHint")}</p>
        {data.members.map((m) => {
          const amount = data.balances[m.id] ?? 0;
          return (
            <div
              key={m.id}
              className="flex flex-wrap justify-between gap-2 border-t border-edge py-2 text-body"
            >
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
    </section>
  );
}
