"use client";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { formatMoney } from "@/lib/format";
import type { GroupSnapshot, SuggestedRepayment } from "./settlement-types";
import { primaryClass } from "./ui";

/** Suggestions create editable drafts; they never record or send money. */
export function SettlementTransfers({
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
  const name = (id: string) => data.members.find((m) => m.id === id)?.name ?? t("formerMember");
  return (
    <section className="space-y-3 rounded-[14px] border border-edge bg-card p-4">
      <h2 className="text-body font-semibold">{t("splitSuggestedRepayments")}</h2>
      {data.transfers.map((x) => {
        const amount = formatMoney(x.amountCents, { locale });
        const label =
          x.from === data.group.memberId
            ? t("youOweMember", { name: name(x.to), amount })
            : x.to === data.group.memberId
              ? t("memberOwesYou", { name: name(x.from), amount })
              : t("memberOwesMember", { from: name(x.from), to: name(x.to), amount });
        return (
          <div key={`${x.from}:${x.to}`} className="space-y-2 border-t border-edge pt-3">
            <p className="text-body font-semibold">{label}</p>
            {!data.group.archivedAt && (
              <button className={primaryClass} disabled={busy} onClick={() => onRecord(x)}>
                {t("recordPayment")}
              </button>
            )}
          </div>
        );
      })}
      {!data.transfers.length && <p className="text-meta text-muted">{t("splitNoTransfers")}</p>}
      {!data.group.archivedAt && (
        <div className="space-y-2 border-t border-edge pt-3">
          <button
            className={`${primaryClass} w-full`}
            disabled={busy || data.members.length < 2}
            onClick={() => onRecord(null)}
          >
            {t("recordPayment")}
          </button>
          {data.members.length < 2 && (
            <p className="text-meta text-muted">{t("splitNeedMembers")}</p>
          )}
        </div>
      )}
      <p className="text-meta text-muted">{t("splitPaymentHint")}</p>
    </section>
  );
}
