"use client";

import { RecordedTime } from "@/components/shared/RecordedTime";
import { SplitBadge } from "./SplitBadge";
import { useStore } from "@/state/store";
import { MAX_GROUP_BULK } from "@/lib/groups/bulk-validation";
import { searchLedger } from "@/lib/groups/search";
import { GroupBulkActions } from "./GroupBulkActions";
import type { GroupLedgerFilters } from "@/lib/groups/search";
import { GroupSpendingInsights } from "./GroupSpendingInsights";
import { Select } from "@/components/ui/Select";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import { EntitySymbol } from "@/components/ui/EntitySymbol";
import type { GroupEntry, GroupSnapshot } from "@/lib/groups/dto";
import { Panel, buttonClass, inputClass } from "./ui";

/** Monthly flows and all-time debt are labeled separately to avoid misleading totals. */
export function GroupOverview({
  data,
  month,
  onMonthChange,
}: {
  data: GroupSnapshot;
  month: string;
  onMonthChange: (month: string) => void;
}) {
  const t = useTranslations("groups"),
    fmt = useFormatters(),
    s = data.summary;
  const tiles = [
    {
      label: t("householdSpending"),
      amount: s.spendingCents,
      surface: "context-major",
    },
    {
      label: t("remaining"),
      amount: data.budget.poolCents - s.spendingCents,
      surface: "context-major-alt",
    },
    { label: t("income"), amount: s.incomeCents, surface: "context-minor" },
  ];
  return (
    <>
      <p className="text-xs text-muted">{t("dailySummaryHint")}</p>
      <div className="space-y-4">
        <div className="context-summary-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tiles.map((x) => (
            <Panel
              key={x.label}
              tone={
                x.label === t("income") ? "mint" : x.label === t("remaining") ? "butter" : "peach"
              }
              className={x.surface}
            >
              <p className="text-xs font-medium text-muted">{x.label}</p>
              <p className="mt-3 text-[26px] font-bold tabular-nums">
                {x.label === t("remaining") && !data.budget.exists
                  ? t("unset")
                  : fmt.money(x.amount)}
              </p>
            </Panel>
          ))}
        </div>
      </div>
      <GroupSpendingInsights data={data} month={month} onMonthChange={onMonthChange} />
    </>
  );
}
/** A paged ledger keeps payer, author and saved allocations visible together. */
export function GroupTransactions({
  data,
  page,
  setPage,
  selectedDate,
  onClearDate,
  filters,
  onFiltersChange,
  loading,
  month,
  refresh,
  onBusyChange,
  onImport,
  onEdit,
  onRefund,
}: {
  data: GroupSnapshot;
  selectedDate?: string;
  onClearDate?: () => void;
  page: number;
  setPage: (n: number) => void;
  filters: GroupLedgerFilters;
  onFiltersChange: (filters: GroupLedgerFilters) => void;
  loading: boolean;
  month: string;
  refresh: () => Promise<void>;
  onBusyChange: (busy: boolean) => void;
  onImport: () => void;
  onEdit: (e: GroupEntry) => void;
  onRefund: (e: GroupEntry) => void;
}) {
  const t = useTranslations("groups"),
    fmt = useFormatters();
  const editedHighlight = useStore((s) => s.editedHighlight);
  const [now, setNow] = useState(0);
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [selecting, setSelecting] = useState(false),
    [bulkBusy, setBulkBusy] = useState(false);
  const selected = Object.entries(selection).map(([id, version]) => ({ id, version }));
  const matches = searchLedger(data.reportEntries ?? data.entries, month, filters);
  const clear = () => setSelection({});
  const changeFilters = (next: GroupLedgerFilters) => {
    clear();
    onFiltersChange(next);
  };
  const chooseRows = (rows: GroupEntry[]) =>
    setSelection((current) => {
      const next = { ...current };
      for (const entry of rows) {
        if (!(entry.id in next) && Object.keys(next).length < MAX_GROUP_BULK)
          next[entry.id] = entry.version;
      }
      return next;
    });
  const toggle = (entry: GroupEntry) =>
    setSelection((current) => {
      const next = { ...current };
      if (entry.id in next) delete next[entry.id];
      else if (Object.keys(next).length < MAX_GROUP_BULK) next[entry.id] = entry.version;
      return next;
    });
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 60000);
    return () => clearInterval(timer);
  }, []);
  const name = (id: string | null) =>
    data.members.find((m) => m.id === id)?.name ?? t("sharedFunds");
  const displayedEntries = selectedDate
    ? searchLedger(data.reportEntries ?? data.entries, month, filters).filter(
        (e) => e.occurredOn === selectedDate,
      )
    : data.entries;
  return (
    <Panel>
      {selectedDate && (
        <button className={`${buttonClass} mb-3`} onClick={onClearDate}>
          {selectedDate} · {t("showFullMonth")}
        </button>
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        {!data.group.archivedAt && (
          <button type="button" className={buttonClass} disabled={bulkBusy} onClick={onImport}>
            {t("bulkImport")}
          </button>
        )}
        <button
          type="button"
          className={buttonClass}
          disabled={bulkBusy}
          aria-pressed={selecting}
          onClick={() => {
            clear();
            setSelecting(!selecting);
          }}
        >
          {t(selecting ? "cancel" : "bulkSelect")}
        </button>
      </div>
      <fieldset disabled={bulkBusy} className="flex min-w-0 flex-wrap gap-3">
        <input
          aria-label={t("search")}
          placeholder={t("search")}
          className={`${inputClass} flex-1`}
          value={filters.query ?? ""}
          maxLength={120}
          onChange={(e) => changeFilters({ ...filters, query: e.target.value })}
        />
        <Select
          className={inputClass + " sm:w-48"}
          value={filters.payer ?? ""}
          aria-label={t("paidBy")}
          onChange={(e) => changeFilters({ ...filters, payer: e.target.value })}
        >
          <option value="">{t("allMembers")}</option>
          <option value="shared">{t("sharedFunds")}</option>
          {data.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
        <Select
          className={inputClass}
          aria-label={t("searchScope")}
          value={filters.scope ?? "month"}
          onChange={(e) => changeFilters({ ...filters, scope: e.target.value as "month" | "all" })}
        >
          <option value="month">{t("selectedMonth")}</option>
          <option value="all">{t("allDates")}</option>
        </Select>
      </fieldset>
      {selecting && (
        <div className="my-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={loading || bulkBusy}
            className={buttonClass}
            onClick={() => chooseRows(data.entries)}
          >
            {t("bulkSelectPage")}
          </button>
          <button
            type="button"
            disabled={loading || bulkBusy}
            className={buttonClass}
            onClick={() => chooseRows(matches)}
          >
            {t("bulkSelectMatches")}
          </button>
          <p className="text-xs text-muted">{t("bulkLimit", { count: MAX_GROUP_BULK })}</p>
        </div>
      )}
      {!!selected.length && (
        <GroupBulkActions
          data={data}
          selection={selected}
          refresh={refresh}
          onClear={clear}
          onBusyChange={(value) => {
            setBulkBusy(value);
            onBusyChange(value);
          }}
        />
      )}
      <p className="my-3 text-xs text-muted" role="status">
        {loading ? t("loading") : t("searchResults", { count: data.totalEntries })}
      </p>
      <div className="divide-y divide-edge" aria-busy={loading}>
        {displayedEntries.map((e) => {
          const c = data.categories.find((c) => c.id === e.categoryId);
          const recentlyEdited =
            editedHighlight &&
            e.version > 0 &&
            !!e.updatedAt &&
            now >= Date.parse(e.updatedAt) &&
            now - Date.parse(e.updatedAt) < 3 * 24 * 60 * 60 * 1000;
          return (
            <article
              key={e.id}
              className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 py-4 sm:flex sm:flex-wrap sm:items-center ${recentlyEdited ? "bg-primary-soft" : ""}`}
            >
              <div className="flex items-center gap-2">
                {selecting && (
                  <label className="flex min-h-11 min-w-11 items-center justify-center">
                    <input
                      type="checkbox"
                      aria-label={t("bulkSelectRecord", { name: e.merchant || t(e.kind) })}
                      checked={e.id in selection}
                      disabled={
                        loading ||
                        bulkBusy ||
                        (!(e.id in selection) && selected.length >= MAX_GROUP_BULK)
                      }
                      onChange={() => toggle(e)}
                      className="h-4 w-4 accent-primary"
                    />
                  </label>
                )}
                <EntitySymbol emoji={c?.emoji ?? "🏷️"} color={c?.color} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="break-words text-sm font-semibold">{e.merchant || t(e.kind)}</h3>
                  <SplitBadge entry={e} />
                </div>
                <p className="mt-1 text-xs text-muted">
                  {t(e.kind)} · {e.occurredOn} · {name(e.payerId)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {t("recordedBy")} {name(e.authorId)}
                </p>
                <RecordedTime value={e.createdAt} />
                {e.note && <p className="mt-1 text-xs text-muted">{e.note}</p>}
                {recentlyEdited && (
                  <p className="mt-1 text-xs text-primary">{t("recentlyEdited")}</p>
                )}
              </div>
              <strong className="text-sm tabular-nums">
                {fmt.money(e.amountCents, { signed: true })}
              </strong>
              {!data.group.archivedAt && (
                <div className="col-span-2 col-start-2 flex flex-wrap gap-2">
                  <button className={buttonClass} disabled={bulkBusy} onClick={() => onEdit(e)}>
                    {t("edit")}
                  </button>
                  {e.kind === "expense" && (
                    <button className={buttonClass} disabled={bulkBusy} onClick={() => onRefund(e)}>
                      {t("refund")}
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })}
        {!displayedEntries.length && <p className="py-6 text-sm text-muted">{t("noEntries")}</p>}
      </div>
      {!selectedDate && (
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            disabled={loading || bulkBusy || page === 0}
            className={buttonClass}
            onClick={() => setPage(page - 1)}
          >
            {t("previous")}
          </button>
          <span className="text-xs text-muted">
            {page + 1} / {Math.max(1, Math.ceil(data.totalEntries / 50))}
          </span>
          <button
            disabled={loading || bulkBusy || (page + 1) * 50 >= data.totalEntries}
            className={buttonClass}
            onClick={() => setPage(page + 1)}
          >
            {t("next")}
          </button>
        </div>
      )}
    </Panel>
  );
}
