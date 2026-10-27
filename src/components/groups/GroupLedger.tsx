"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import { EntitySymbol } from "@/components/ui/EntitySymbol";
import type { GroupEntry, GroupSnapshot } from "@/lib/groups/dto";
import { Panel, buttonClass, inputClass } from "./ui";

/** Monthly flows and all-time debt are labeled separately to avoid misleading totals. */
export function GroupOverview({ data }: { data: GroupSnapshot }) {
  const t = useTranslations("groups"),
    fmt = useFormatters(),
    s = data.summary;
  const tiles = [
    { label: t("householdSpending"), amount: s.spendingCents },
    { label: t("remaining"), amount: data.budget.poolCents - s.spendingCents },
    { label: t("income"), amount: s.incomeCents },
  ];
  return (
    <>
      <p className="text-xs text-muted">{t("dailySummaryHint")}</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((x) => (
          <Panel key={x.label}>
            <p className="text-xs font-medium text-muted">{x.label}</p>
            <p className="mt-3 text-[26px] font-bold tabular-nums">
              {x.label === t("remaining") && !data.budget.exists ? t("unset") : fmt.money(x.amount)}
            </p>
          </Panel>
        ))}
      </div>
      <Panel>
        <h2 className="font-bold">{t("categorySpending")}</h2>
        <div className="mt-4 space-y-3">
          {Object.entries(s.categorySpending).map(([id, amount]) => {
            const c = data.categories.find((c) => c.id === id);
            return (
              <div key={id} className="flex items-center gap-3">
                <EntitySymbol emoji={c?.emoji ?? "🏷️"} color={c?.color} />
                <span className="flex-1 text-sm">{c?.name ?? t("uncategorized")}</span>
                <strong className="text-sm tabular-nums">{fmt.money(amount)}</strong>
              </div>
            );
          })}
          {!Object.keys(s.categorySpending).length && (
            <p className="text-sm text-muted">{t("noEntries")}</p>
          )}
        </div>
      </Panel>
    </>
  );
}
/** A paged ledger keeps payer, author and saved allocations visible together. */
export function GroupTransactions({
  data,
  page,
  setPage,
  onEdit,
  onRefund,
}: {
  data: GroupSnapshot;
  page: number;
  setPage: (n: number) => void;
  onEdit: (e: GroupEntry) => void;
  onRefund: (e: GroupEntry) => void;
}) {
  const t = useTranslations("groups"),
    fmt = useFormatters(),
    [query, setQuery] = useState(""),
    [member, setMember] = useState("");
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 60000);
    return () => clearInterval(timer);
  }, []);
  const name = (id: string | null) =>
    data.members.find((m) => m.id === id)?.name ?? t("sharedFunds");
  return (
    <Panel>
      <div className="flex flex-wrap gap-3">
        <input
          aria-label={t("search")}
          placeholder={t("search")}
          className={`${inputClass} flex-1`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
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
        </select>
      </div>
      <p className="my-3 text-xs text-muted">{t("pageFilter")}</p>
      <div className="divide-y divide-edge">
        {data.entries
          .filter(
            (e) =>
              e.merchant.toLowerCase().includes(query.toLowerCase()) &&
              (!member || e.payerId === member),
          )
          .map((e) => {
            const c = data.categories.find((c) => c.id === e.categoryId);
            const recentlyEdited =
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
                  <h3 className="truncate text-sm font-semibold">{e.merchant || t(e.kind)}</h3>
                  <p className="mt-1 text-xs text-muted">
                    {t(e.kind)} · {e.occurredOn} · {name(e.payerId)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {t("recordedBy")} {name(e.authorId)}
                  </p>
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
        {!data.entries.length && <p className="py-6 text-sm text-muted">{t("noEntries")}</p>}
      </div>
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
    </Panel>
  );
}
