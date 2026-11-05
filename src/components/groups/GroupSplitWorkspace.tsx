"use client";
import { useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { Select } from "@/components/ui/Select";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { formatMoney } from "@/lib/format";
import { monthRange, type SplitRange } from "@/lib/groups/split-range";
import { splitRecordStatus } from "@/lib/groups/split-workspace";
import type { GroupSnapshot, GroupOperationRunner } from "./settlement-types";
import { GroupSplitSettings } from "./GroupSplitSettings";
import { SplitPeriodPicker } from "./SplitPeriodPicker";
import { SplitRecordRow } from "./SplitRecordRow";
import { SplitPreviewDialog } from "./SplitPreviewDialog";
import { useSplitFilters } from "./useSplitFilters";
import { useSplitWorkspace } from "./useSplitWorkspace";
import { useSettlementDirty } from "./useSettlementDirty";
import { Panel, inputClass, primaryClass, buttonClass } from "./ui";

/** One period owner and persistent draft model serve both responsive layouts. */
export function GroupSplitWorkspace({
  data,
  month,
  run,
  busy,
  attention = false,
  onReturn,
  onDirtyChange,
  onRulesDirtyChange,
}: {
  data: GroupSnapshot;
  month: string;
  run: GroupOperationRunner;
  busy: boolean;
  attention?: boolean;
  onReturn?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onRulesDirtyChange?: (dirty: boolean) => void;
}) {
  const t = useTranslations("groups");
  const locale = useStore((s) => s.locale);
  const [ranges, setRanges] = useState<SplitRange[]>([monthRange(month)]);
  const { filter, query, payer, category, setFilter, setQuery, setPayer, setCategory, clear } =
    useSplitFilters(attention);
  const rulesRef = useRef<HTMLDetailsElement>(null);
  const recordsRef = useRef<HTMLDivElement>(null);
  const model = useSplitWorkspace(data, ranges, attention, run);
  useSettlementDirty(model.dirty, onDirtyChange);
  const entries = data.reportEntries ?? data.entries;
  const months = [...new Set([month, ...entries.map((e) => e.occurredOn.slice(0, 7))])]
    .sort()
    .reverse();
  const visible = model.rows.filter(
    (e) =>
      (filter === "all" || splitRecordStatus(e) === filter) &&
      (!payer || e.payerId === payer) &&
      (!category || e.categoryId === category) &&
      `${e.merchant} ${e.note}`
        .toLocaleLowerCase(locale)
        .includes(query.trim().toLocaleLowerCase(locale)),
  );
  const hiddenIncluded = model.included.filter((e) => !visible.some((r) => r.id === e.id)).length;
  const showRules = () => {
    if (rulesRef.current) {
      rulesRef.current.open = true;
      rulesRef.current.scrollIntoView?.({ block: "center" });
    }
  };
  const blocker = model.needsRules
    ? t("splitRulesRequired")
    : !model.validRanges
      ? t("splitChoosePeriod")
      : model.unresolved.length
        ? t("splitReviewRequired")
        : model.blockers.length
          ? t("splitBlocked", {
              name: model.blockers[0].entry.merchant || t(model.blockers[0].entry.kind),
              message: model.blockers[0].message,
            })
          : "";
  return (
    <div className="split-workspace">
      <aside className="split-support space-y-3">
        <Panel tone="butter">
          {attention ? (
            <div className="space-y-2">
              <h2 className="text-body font-semibold">{t("splitAttentionScope")}</h2>
              <p className="text-meta text-muted">{t("splitAttentionHint")}</p>
              <button className={buttonClass} onClick={onReturn}>
                {t("splitReturnPeriod")}
              </button>
            </div>
          ) : (
            <SplitPeriodPicker
              month={month}
              months={months}
              ranges={ranges}
              onChange={setRanges}
              disabled={busy}
            />
          )}
        </Panel>
        <details ref={rulesRef} className="rounded-[14px] border border-edge bg-card p-4">
          <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-2 text-body font-semibold">
            {t("splitRules")}
            <ChevronDown size={16} strokeWidth={2} aria-hidden />
          </summary>
          <GroupSplitSettings
            data={data}
            run={run}
            busy={busy}
            onDirtyChange={onRulesDirtyChange}
          />
        </details>
        <div className="hidden rounded-[14px] border border-edge bg-card p-4 text-meta text-muted xl:block">
          <p className="font-semibold text-ink">{t("splitSelectionSummary")}</p>
          <p className="mt-2">
            {t("splitPreviewCounts", {
              count: model.included.length,
              kept: model.kept.length,
              skipped: model.skipped.length,
            })}
          </p>
          <p className="mt-2 font-semibold tabular-nums text-ink">
            {formatMoney(-model.included.reduce((n, e) => n + e.amountCents, 0), { locale })}
          </p>
          <p className="mt-1">{t("splitNetSelected")}</p>
          <p className="mt-3">{t("splitSelectionHint")}</p>
        </div>
        <details className="mt-1 text-meta text-muted">
          <summary className="flex min-h-11 cursor-pointer items-center">
            {t("splitSelectionHelp")}
          </summary>
          <p className="mb-3">{t("splitSelectionHint")}</p>
        </details>
      </aside>
      <div ref={recordsRef} className="split-main min-w-0">
        <Panel>
          <div className="split-record-heading">
            <h2 className="text-body font-bold">
              {t("splitRecords", { count: model.rows.length })}
            </h2>
            <p className="text-meta text-muted">
              {attention ? t("splitAllDates") : t("splitSelectedDates")}
            </p>
            <label className="split-record-search flex min-h-11 items-center gap-2 rounded-[10px] border border-edge bg-card px-3">
              <Search size={16} strokeWidth={2} className="shrink-0 text-muted" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={t("splitSearch")}
                placeholder={t("splitSearch")}
                className="min-h-11 w-full min-w-0 bg-transparent text-control font-normal outline-none"
              />
            </label>
          </div>
          {!!model.extra && (
            <p className="mt-2 text-meta text-muted">
              {t("splitExtraRecords", { count: model.extra })}
            </p>
          )}
          <SegmentedControl
            className="mt-3 max-w-full"
            size="compact"
            label={t("splitRecordFilters")}
            value={filter}
            onChange={setFilter}
            options={["all", "new", "changed", "calculated", "kept"].map((value) => ({
              value,
              label: t(`splitFilter_${value}`, {
                count:
                  value === "all"
                    ? model.rows.length
                    : model.rows.filter((e) => splitRecordStatus(e) === value).length,
              }),
            }))}
          />
          <details className="mt-1">
            <summary className="flex min-h-11 cursor-pointer items-center text-meta font-medium text-muted">
              {t("splitMoreFilters")}
            </summary>
            <div className="grid gap-2 pb-2 sm:grid-cols-2">
              <Select
                aria-label={t("paidBy")}
                className={inputClass}
                value={payer}
                onChange={(e) => setPayer(e.target.value)}
              >
                <option value="">{t("splitAllPayers")}</option>
                {data.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
              <Select
                aria-label={t("category")}
                className={inputClass}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">{t("splitAllCategories")}</option>
                {data.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </details>
          <div className="flex flex-wrap items-center gap-2 border-b border-edge pb-3">
            <button
              type="button"
              className={buttonClass}
              disabled={busy || !!data.group.archivedAt || !visible.length}
              onClick={() => model.choose(visible, "include")}
            >
              {t("includeShown")}
            </button>
            <button
              type="button"
              className={buttonClass}
              disabled={busy || !!data.group.archivedAt || !visible.length}
              onClick={() => model.choose(visible, "exclude")}
            >
              {t("keepOrSkipShown")}
            </button>
          </div>
          <div className="divide-y divide-edge">
            {visible.map((e) => (
              <SplitRecordRow
                key={e.id}
                entry={e}
                data={data}
                family={model.families.get(e.id)!}
                decision={model.decision(e)}
                onChange={(value) => model.choose([e], value)}
                disabled={busy || !!data.group.archivedAt}
              />
            ))}
          </div>
          {!visible.length && (
            <div className="py-6 text-body text-muted">
              <p>{t(model.rows.length ? "noEntries" : "splitNoEligible")}</p>
              <button
                type="button"
                className={`${buttonClass} mt-3`}
                onClick={
                  model.rows.length
                    ? clear
                    : attention
                      ? onReturn
                      : () =>
                          recordsRef.current
                            ?.closest(".split-workspace")
                            ?.querySelector<HTMLButtonElement>("[data-period-open]")
                            ?.click()
                }
              >
                {t(model.rows.length ? "splitClearFilters" : "splitChangePeriod")}
              </button>
            </div>
          )}
          <div
            data-mobile-bottom-action
            className="split-review-bar sticky bottom-3 z-10 mt-3 space-y-2 rounded-[14px] border border-edge bg-card p-3 shadow-sm"
          >
            <p role="status" aria-live="polite" className="text-meta text-muted">
              {t("splitPreviewCounts", {
                count: model.included.length,
                kept: model.kept.length,
                skipped: model.skipped.length,
              })}
              {hiddenIncluded > 0
                ? ` · ${t("splitHiddenSelection", { count: hiddenIncluded })}`
                : ""}
            </p>
            {(model.error || blocker) && (
              <p role="alert" className="break-words text-meta text-danger">
                {model.error || blocker}
              </p>
            )}
            {!!blocker && (
              <button
                type="button"
                className={buttonClass}
                onClick={
                  model.needsRules
                    ? showRules
                    : () => {
                        if (model.unresolved.length) {
                          clear();
                          setFilter("changed");
                        } else if (!model.validRanges)
                          recordsRef.current
                            ?.closest(".split-workspace")
                            ?.querySelector<HTMLButtonElement>("[data-period-open]")
                            ?.click();
                        else {
                          clear();
                        }
                        recordsRef.current?.scrollIntoView?.({ block: "start" });
                      }
                }
              >
                {t(
                  model.needsRules
                    ? "splitFixRules"
                    : model.unresolved.length
                      ? "splitReviewUpdates"
                      : !model.validRanges
                        ? "splitChangePeriod"
                        : "splitShowRecords",
                )}
              </button>
            )}
            <button
              type="button"
              className={`${primaryClass} w-full`}
              disabled={busy || !!data.group.archivedAt || !model.eligible}
              onClick={model.review}
            >
              {t("reviewSplit", { count: model.included.length })}
            </button>
          </div>
        </Panel>
      </div>
      {model.reviewing && (
        <SplitPreviewDialog
          data={data}
          preview={model.preview}
          nextBalance={model.nextBalance}
          count={model.included.length}
          kept={model.kept.length}
          skipped={model.skipped.length}
          extra={model.extra}
          error={model.error}
          busy={busy}
          onClose={model.closeReview}
          onApply={() => {
            if (!busy) void model.apply();
          }}
        />
      )}
    </div>
  );
}
