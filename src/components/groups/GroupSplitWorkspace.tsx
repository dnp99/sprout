"use client";
import { compareRecordOrder } from "@/lib/record-order";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { Select } from "@/components/ui/Select";
import { formatMoney } from "@/lib/format";
import { balances, transfers } from "@/lib/groups/accounting";
import {
  calculateSplit,
  calculatedEntries,
  equalWeights,
  snapshotSplitRules,
  savedSplit,
  splitEligible,
} from "@/lib/groups/split";
import { inSplitRanges, monthRange, splitFamily, type SplitRange } from "@/lib/groups/split-range";
import type { GroupEntry, GroupSnapshot } from "@/lib/groups/dto";
import type { GroupOperation } from "@/lib/groups/validation";
import { GroupSplitSettings } from "./GroupSplitSettings";
import { SplitPeriodPicker } from "./SplitPeriodPicker";
import { SplitBadge } from "./SplitBadge";
import { Panel, inputClass, primaryClass } from "./ui";

type Props = {
  data: GroupSnapshot;
  month: string;
  run: (op: GroupOperation) => Promise<unknown>;
  busy: boolean;
};
/** Original ledger, reusable preferences, and replaceable calculations are distinct. */
export function GroupSplitWorkspace({ data, month, run, busy }: Props) {
  const t = useTranslations("groups");
  const [ranges, setRanges] = useState<SplitRange[]>([monthRange(month)]);
  const entries = data.reportEntries ?? data.entries;
  const months = [...new Set([month, ...entries.map((e) => e.occurredOn.slice(0, 7))])]
    .sort()
    .reverse();
  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]">
      <GroupSplitSettings data={data} run={run} busy={busy} />
      <div className="min-w-0 space-y-4">
        <Panel tone="butter">
          <h2 className="mb-3 font-bold">{t("splitCalculate")}</h2>
          <p className="mb-4 text-xs text-muted">{t("splitCalculateHint")}</p>
          <SplitPeriodPicker
            month={month}
            months={months}
            ranges={ranges}
            onChange={setRanges}
            disabled={busy}
          />
        </Panel>
        <SplitCalculation
          key={`${data.group.revision}:${JSON.stringify(ranges)}`}
          data={data}
          entries={entries}
          ranges={ranges}
          run={run}
          busy={busy}
        />
      </div>
    </div>
  );
}

function SplitCalculation({
  data,
  entries,
  ranges,
  run,
  busy,
}: Omit<Props, "month"> & { entries: GroupEntry[]; ranges: SplitRange[] }) {
  const t = useTranslations("groups");
  const locale = useStore((s) => s.locale);
  const money = (n: number) => formatMoney(n, { locale });
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const inPeriod = entries.filter(
    (e) =>
      (splitEligible(e) || savedSplit(e)?.review === "pending") &&
      inSplitRanges(e.occurredOn, ranges),
  );
  const ids = new Set(inPeriod.flatMap((e) => splitFamily(entries, e.id).map((r) => r.id)));
  const rows = entries
    .filter((e) => ids.has(e.id))
    .sort((a, b) => compareRecordOrder({ ...a, date: a.occurredOn }, { ...b, date: b.occurredOn }));
  const decision = (e: GroupEntry) => {
    if (choices[e.id] !== undefined) return choices[e.id];
    const family = splitFamily(entries, e.id);
    if (family.some((r) => savedSplit(r)?.review === "excluded")) return "exclude";
    if (family.some((r) => savedSplit(r)?.review === "pending")) return "";
    return "include";
  };
  const change = (e: GroupEntry, value: string) =>
    setChoices((old) => ({
      ...old,
      ...Object.fromEntries(splitFamily(entries, e.id).map((r) => [r.id, value])),
    }));
  const included = rows.filter((e) => decision(e) === "include");
  const unresolved = rows.some((e) => decision(e) === "");
  const baseline =
    data.splitDefaults.method === "equal"
      ? equalWeights(data.members)
      : data.splitDefaults.participants;
  let preview: ReturnType<typeof calculateSplit> = new Map();
  let previewError = "";
  try {
    preview = calculateSplit(
      entries,
      included.map((e) => e.id),
      data.categories,
      snapshotSplitRules(data),
      baseline,
    );
  } catch (e) {
    previewError = e instanceof Error ? e.message : t("failed");
  }
  const projected = entries.map((e) =>
    preview.has(e.id)
      ? {
          ...e,
          splitResult: {
            snapshot: preview.get(e.id)!,
            review: "current" as const,
            reviewedVersion: e.version,
            calculatedAt: "",
          },
        }
      : e,
  );
  const nextBalance = balances(calculatedEntries(projected), data.repayments);
  const name = (id: string) => data.members.find((m) => m.id === id)?.name ?? t("formerMember");
  const validRanges = ranges.length > 0 && ranges.every((r) => r.from && r.to && r.from <= r.to);
  return (
    <Panel tone="peach">
      <h2 className="font-bold">{t("splitRecords", { count: rows.length })}</h2>
      <p className="mt-2 text-xs text-muted">{t("splitReviewHint")}</p>
      {rows.some((e) => !inSplitRanges(e.occurredOn, ranges)) && (
        <p className="mt-2 text-xs text-muted">{t("splitLinkedHint")}</p>
      )}
      <div className="mt-4 max-h-[480px] divide-y divide-edge overflow-y-auto">
        {rows.map((e) => {
          const saved = savedSplit(e),
            changed = saved && saved.review !== "current";
          return (
            <div key={e.id} className="space-y-2 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <SplitBadge entry={e} />
                  <strong className="truncate text-sm">{e.merchant || t(e.kind)}</strong>
                </div>
                <span className="text-sm tabular-nums">{money(e.amountCents)}</span>
              </div>
              <p className="text-xs text-muted">
                {e.occurredOn} ·{" "}
                {data.categories.find((c) => c.id === e.categoryId)?.name ?? t("uncategorized")}
              </p>
              {changed && (
                <p className="text-xs text-muted">
                  {t("splitPrevious", {
                    amount: money(saved.snapshot.amountCents),
                    category:
                      data.categories.find((c) => c.id === saved.snapshot.categoryId)?.name ??
                      t("uncategorized"),
                  })}
                </p>
              )}
              <Select
                aria-label={t("splitDecision", { name: e.merchant || t(e.kind) })}
                className={inputClass}
                value={decision(e)}
                disabled={busy || !!data.group.archivedAt}
                onChange={(event) => change(e, event.target.value)}
              >
                <option value="">{t("splitReviewChoice")}</option>
                <option value="include">{t("splitInclude")}</option>
                <option value="exclude">{t(saved ? "splitKeepPrevious" : "splitSkip")}</option>
              </Select>
              {saved?.review === "excluded" && (
                <p className="text-xs text-muted">{t("splitExcludedHint")}</p>
              )}
            </div>
          );
        })}
      </div>
      {!rows.length && <p className="my-4 text-sm text-muted">{t("noEntries")}</p>}
      <div className="mt-4 space-y-2 border-t border-edge pt-4">
        <h3 className="text-sm font-semibold">{t("splitPreview")}</h3>
        {data.members.map((m) => (
          <div key={m.id} className="flex justify-between gap-3 text-sm">
            <span>{m.name}</span>
            <strong className="tabular-nums">
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
        <p className="pt-2 text-xs text-muted">{t("splitNetPreview")}</p>
        {transfers(nextBalance).map((x) => (
          <p key={`${x.from}:${x.to}`} className="text-sm">
            {name(x.from)} → {name(x.to)} · {money(x.amountCents)}
          </p>
        ))}
        {!transfers(nextBalance).length && <p className="text-sm text-muted">{t("allSettled")}</p>}
      </div>
      {(error || previewError) && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error || previewError}
        </p>
      )}
      {unresolved && <p className="mt-3 text-xs text-warning">{t("splitReviewRequired")}</p>}
      <button
        className={`${primaryClass} mt-4`}
        disabled={
          busy ||
          !!data.group.archivedAt ||
          !validRanges ||
          !rows.length ||
          unresolved ||
          !!previewError ||
          !data.splitDefaults.valid
        }
        onClick={async () => {
          try {
            // Skipped uncalculated records have no result to acknowledge or overwrite.
            const selected = rows.filter((e) => decision(e) === "include" || savedSplit(e));
            if (!selected.length) return;
            await run({
              type: "split",
              entries: selected.map((e) => ({
                id: e.id,
                version: e.version,
                decision: decision(e) as "include" | "exclude",
              })),
            });
            setError("");
          } catch (e) {
            setError(e instanceof Error ? e.message : t("failed"));
          }
        }}
      >
        {t("splitApply", { count: included.length })}
      </button>
    </Panel>
  );
}
