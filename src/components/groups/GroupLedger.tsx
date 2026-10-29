"use client";

import { RecordedTime } from "@/components/shared/RecordedTime";
import { compareRecordOrder } from "@/lib/record-order";
import { SplitBadge } from "./SplitBadge";
import { useStore } from "@/state/store";
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
  onEdit,
  onRefund,
}: {
  data: GroupSnapshot;
  selectedDate?: string;
  onClearDate?: () => void;
  page: number;
  setPage: (n: number) => void;
  onEdit: (e: GroupEntry) => void;
  onRefund: (e: GroupEntry) => void;
}) {
  const t = useTranslations("groups"),
    fmt = useFormatters(),
    [query, setQuery] = useState(""),
    [member, setMember] = useState("");
  const editedHighlight = useStore((s) => s.editedHighlight);
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 60000);
    return () => clearInterval(timer);
  }, []);
  const name = (id: string | null) =>
    data.members.find((m) => m.id === id)?.name ?? t("sharedFunds");
  const displayedEntries = selectedDate
    ? (data.reportEntries ?? data.entries).filter((e) => e.occurredOn === selectedDate)
    : data.entries;
  return (
    <Panel>
      {selectedDate && (
        <button className={`${buttonClass} mb-3`} onClick={onClearDate}>
          {selectedDate} · {t("showFullMonth")}
        </button>
      )}
      <div className="flex flex-wrap gap-3">
        <input
          aria-label={t("search")}
          placeholder={t("search")}
          className={`${inputClass} flex-1`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select
          className={inputClass + " sm:w-48"}
          value={member}
          aria-label={t("paidBy")}
          onChange={(e) => setMember(e.target.value)}
        >
          <option value="">{t("allMembers")}</option>
          {data.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      </div>
      <p className="my-3 text-xs text-muted">{t("pageFilter")}</p>
      <div className="divide-y divide-edge">
        {displayedEntries
          .filter(
            (e) =>
              e.merchant.toLowerCase().includes(query.toLowerCase()) &&
              (!member || e.payerId === member),
          )
          .sort((a, b) =>
            compareRecordOrder({ ...a, date: a.occurredOn }, { ...b, date: b.occurredOn }),
          )
          .map((e) => {
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
                className={`flex flex-wrap items-center gap-3 py-4 ${recentlyEdited ? "bg-primary-soft" : ""}`}
              >
                <EntitySymbol emoji={c?.emoji ?? "🏷️"} color={c?.color} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">{e.merchant || t(e.kind)}</h3>
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
                  <div className="flex gap-2">
                    <button className={buttonClass} onClick={() => onEdit(e)}>
                      {t("edit")}
                    </button>
                    {e.kind === "expense" && (
                      <button className={buttonClass} onClick={() => onRefund(e)}>
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
          <button disabled={page === 0} className={buttonClass} onClick={() => setPage(page - 1)}>
            {t("previous")}
          </button>
          <span className="text-xs text-muted">
            {page + 1} / {Math.max(1, Math.ceil(data.totalEntries / 50))}
          </span>
          <button
            disabled={(page + 1) * 50 >= data.totalEntries}
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
