"use client";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { Checkbox } from "@/components/ui/Checkbox";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { formatMoney } from "@/lib/format";
import { savedSplit } from "@/lib/groups/split";
import { splitRecordStatus, type SplitDecision } from "@/lib/groups/split-workspace";
import type { GroupEntry, GroupSnapshot } from "@/lib/groups/dto";
import { SplitBadge } from "./SplitBadge";

/** Routine inclusion stays compact; changed debt needs the previous financial
 * context and an explicit choice before replacing a saved calculation. */
export function SplitRecordRow({
  entry,
  data,
  family,
  decision,
  onChange,
  disabled,
}: {
  entry: GroupEntry;
  data: GroupSnapshot;
  family: GroupEntry[];
  decision: SplitDecision;
  onChange: (value: SplitDecision) => void;
  disabled: boolean;
}) {
  const t = useTranslations("groups");
  const locale = useStore((s) => s.locale);
  const money = (amount: number) => formatMoney(amount, { locale });
  const category = (id: string | null) =>
    data.categories.find((c) => c.id === id)?.name ?? t("uncategorized");
  const payer = (id: string | null) =>
    data.members.find((m) => m.id === id)?.name ?? t(id ? "formerMember" : "sharedFunds");
  const saved = savedSplit(entry);
  const changed = saved && saved.review !== "current";
  return (
    <article data-split-record={entry.id} className="split-record py-3">
      <div className="flex items-start gap-3">
        {!changed && (
          <Checkbox
            checked={decision === "include"}
            disabled={disabled}
            label={t("splitDecision", { name: entry.merchant || t(entry.kind) })}
            onChange={() => onChange(decision === "include" ? "exclude" : "include")}
            className="min-h-11 min-w-11 justify-center"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-body font-semibold">
                <SplitBadge entry={entry} />
                <span className="break-words">{entry.merchant || t(entry.kind)}</span>
              </p>
              <p className="mt-1 break-words text-meta text-muted">
                {entry.occurredOn} · {category(entry.categoryId)}
              </p>
            </div>
            <span
              className={`shrink-0 text-body font-semibold tabular-nums ${entry.kind === "refund" ? "text-green" : ""}`}
            >
              {money(entry.amountCents)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-meta text-muted">
            <span>{t("splitPaidBy", { name: payer(entry.payerId) })}</span>
            <span className={saved?.review === "pending" ? "text-warning" : ""}>
              {t(`splitStatus_${splitRecordStatus(entry)}`)}
            </span>
            {decision === "exclude" && <span>{t(saved ? "splitKeepShort" : "splitSkipped")}</span>}
          </div>
          {changed && (
            <div className="mt-3 rounded-[10px] bg-track p-3">
              <p className="text-meta font-medium">
                {t("splitPrevious", {
                  amount: money(saved.snapshot.amountCents),
                  category: category(saved.snapshot.categoryId),
                })}
              </p>
              <p className="mt-1 text-meta text-muted">
                {saved.snapshot.occurredOn} ·{" "}
                {t("splitPaidBy", { name: payer(saved.snapshot.payerId) })}
              </p>
              <SegmentedControl
                className="mt-2 max-w-full"
                label={t("splitDecision", { name: entry.merchant || t(entry.kind) })}
                value={decision}
                onChange={onChange}
                disabled={disabled}
                size="compact"
                options={[
                  { value: "include", label: t("splitIncludeShort") },
                  { value: "exclude", label: t("splitKeepShort") },
                ]}
              />
            </div>
          )}
          {family.length > 1 && (
            <details className="mt-1">
              <summary className="flex min-h-11 cursor-pointer items-center text-meta font-medium text-primary">
                {t("splitFamilyLabel", { count: family.length })}
              </summary>
              <p className="mb-2 text-meta text-muted">{t("splitLinkedHint")}</p>
              <ul className="space-y-1 text-meta text-muted">
                {family.map((e) => (
                  <li key={e.id}>
                    {e.occurredOn} · {e.merchant || t(e.kind)} · {money(e.amountCents)}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </article>
  );
}
