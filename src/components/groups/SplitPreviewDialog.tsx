"use client";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { formatMoney } from "@/lib/format";
import { transfers } from "@/lib/groups/accounting";
import type { GroupSnapshot, SplitSnapshot } from "@/lib/groups/dto";
import { GroupDialog, primaryClass, buttonClass } from "./ui";

/** Selection shares and all-time debt are distinct even when their totals differ. */
export function SplitPreviewDialog({
  data,
  preview,
  nextBalance,
  count,
  kept,
  skipped,
  extra,
  error,
  busy,
  onClose,
  onApply,
}: {
  data: GroupSnapshot;
  preview: Map<string, SplitSnapshot>;
  nextBalance: Record<string, number>;
  count: number;
  kept: number;
  skipped: number;
  extra: number;
  error: string;
  busy: boolean;
  onClose: () => void;
  onApply: () => void;
}) {
  const t = useTranslations("groups");
  const locale = useStore((s) => s.locale);
  const money = (n: number) => formatMoney(n, { locale });
  const name = (id: string) => data.members.find((m) => m.id === id)?.name ?? t("formerMember");
  const suggested = transfers(nextBalance);
  return (
    <GroupDialog
      title={t("splitPreview")}
      width={520}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="space-y-4 pt-2">
        <p className="text-meta text-muted">{t("splitPreviewHint")}</p>
        <p className="text-meta">{t("splitPreviewCounts", { count, kept, skipped })}</p>
        {!!extra && (
          <p className="text-meta text-muted">{t("splitExtraRecords", { count: extra })}</p>
        )}
        <section className="rounded-[14px] bg-track p-4">
          <h3 className="mb-3 text-body font-semibold">{t("periodShares")}</h3>
          {data.members.map((m) => (
            <div key={m.id} className="flex justify-between gap-3 py-1 text-body">
              <span className="min-w-0 break-words">{m.name}</span>
              <strong className="shrink-0 tabular-nums">
                {money(
                  [...preview.values()].reduce(
                    (n, s) =>
                      n +
                      (s.kind === "refund" ? -1 : 1) *
                        (s.shares.find((p) => p.memberId === m.id)?.amountCents ?? 0),
                    0,
                  ),
                )}
              </strong>
            </div>
          ))}
        </section>
        <section>
          <h3 className="text-body font-semibold">{t("overallAfterSplit")}</h3>
          <p className="mt-1 text-meta text-muted">{t("splitNetPreview")}</p>
          <div className="mt-3 space-y-2">
            {suggested.map((x) => (
              <p key={`${x.from}:${x.to}`} className="text-body">
                {name(x.from)} → {name(x.to)} ·{" "}
                <strong className="tabular-nums">{money(x.amountCents)}</strong>
              </p>
            ))}
            {!suggested.length && <p className="text-body text-muted">{t("allSettled")}</p>}
          </div>
        </section>
        {error && (
          <p role="alert" className="text-body text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2 border-t border-edge pt-4">
          <button type="button" className={buttonClass} disabled={busy} onClick={onClose}>
            {t("splitBackToRecords")}
          </button>
          <button type="button" className={primaryClass} disabled={busy} onClick={onApply}>
            {t("splitApply", { count })}
          </button>
        </div>
      </div>
    </GroupDialog>
  );
}
