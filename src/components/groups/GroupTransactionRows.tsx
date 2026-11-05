"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { MoreHorizontal } from "lucide-react";
import { Popover } from "@/components/ui/Popover";
import { Checkbox } from "@/components/ui/Checkbox";
import { Modal } from "@/components/ui/overlays";
import { EntitySymbol } from "@/components/ui/EntitySymbol";
import { RecordedTime } from "@/components/shared/RecordedTime";
import { RecordSummary } from "@/components/shared/RecordSummary";
import { LedgerSortButton } from "@/components/shared/LedgerSortButton";
import { useFormatters } from "@/i18n/useFormatters";
import type { GroupEntry, GroupSnapshot } from "@/lib/groups/dto";
import type { GroupLedgerFilters } from "@/lib/groups/search";
import { groupCategoryLabel } from "@/lib/groups/category-tree";
import { SplitBadge } from "./SplitBadge";
import { buttonClass, primaryClass } from "./ui";

export const GROUP_TRANSACTION_GRID =
  "grid grid-cols-[24px_minmax(120px,1.8fr)_minmax(100px,1.2fr)_minmax(90px,1fr)_minmax(120px,1.2fr)_90px_32px] items-center gap-2";
export function GroupTransactionColumns({
  allSelected,
  toggleAll,
  filters,
  onSort,
  disabled,
}: {
  allSelected: boolean;
  toggleAll: () => void;
  filters: GroupLedgerFilters;
  onSort: (key: NonNullable<GroupLedgerFilters["sort"]>) => void;
  disabled: boolean;
}) {
  const t = useTranslations("txns"),
    g = useTranslations("groups");
  const columns = [
    ["merchant", t("colMerchant")],
    ["category", t("colCategory")],
    ["payer", g("paidBy")],
    ["date", t("colDate")],
    ["amount", t("colAmount")],
  ] as const;
  return (
    <div
      className={`${GROUP_TRANSACTION_GRID} min-h-[58px] px-3 text-[11px] font-semibold tracking-[.03em] text-muted`}
    >
      <span className={disabled ? "pointer-events-none opacity-50" : ""}>
        <Checkbox
          disabled={disabled}
          checked={allSelected}
          onChange={toggleAll}
          label={t("selectAll")}
        />
      </span>
      {columns.map(([key, label]) => (
        <LedgerSortButton
          key={key}
          label={label}
          active={(filters.sort ?? "date") === key}
          direction={filters.direction ?? "desc"}
          onClick={() => {
            if (!disabled) onSort(key);
          }}
          title={t("sortBy", { column: label.toLowerCase() })}
          className={key === "amount" ? "justify-end" : ""}
        />
      ))}
    </div>
  );
}
export function GroupTransactionRow({
  entry,
  data,
  desktop,
  selected,
  selecting,
  disabled,
  onToggle,
  onOpen,
  onEdit,
  onRefund,
  recentlyEdited,
  selectionDisabled = false,
}: {
  entry: GroupEntry;
  data: GroupSnapshot;
  desktop: boolean;
  selected: boolean;
  selecting: boolean;
  disabled: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onEdit: () => void;
  onRefund: () => void;
  recentlyEdited: boolean;
  selectionDisabled?: boolean;
}) {
  const t = useTranslations("groups"),
    fmt = useFormatters();
  const category = data.categories.find((c) => c.id === entry.categoryId);
  const payer = data.members.find((m) => m.id === entry.payerId)?.name ?? t("sharedFunds");
  const name = entry.merchant || t(entry.kind);
  const categoryName = groupCategoryLabel(data.categories, entry.categoryId) || t("uncategorized");
  const merchant = (
    <span className="block min-w-0">
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate font-semibold">{name}</span>
        {desktop && <SplitBadge entry={entry} />}
        {desktop && recentlyEdited && (
          <span className="shrink-0 rounded-full bg-primary-soft px-1.5 text-[10px] text-primary">
            {t("recentlyEdited")}
          </span>
        )}
      </span>
      {desktop && entry.note && <RecordSummary category={entry.note} />}
    </span>
  );
  if (desktop)
    return (
      <article
        data-selected={selected}
        data-highlight={recentlyEdited}
        className={`record-row txrow ${GROUP_TRANSACTION_GRID} min-h-14 border-t border-edge px-3 text-[12.5px] ${selected ? "bg-primary-soft" : "bg-card hover:bg-track"}`}
      >
        <Checkbox
          disabled={disabled || selectionDisabled}
          checked={selected}
          onChange={onToggle}
          label={t("bulkSelectRecord", { name })}
        />
        <button
          type="button"
          className="flex min-h-14 min-w-0 items-center gap-2 text-left"
          onClick={onOpen}
          aria-label={`${t("recordDetails")}: ${name}`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-track text-[11px] font-semibold">
            {name.slice(0, 1).toUpperCase()}
          </span>
          {merchant}
        </button>
        <span className="flex min-w-0 items-center gap-2" title={categoryName}>
          <EntitySymbol emoji={category?.emoji ?? "🏷️"} color={category?.color} size={16} />
          <span className="truncate">{categoryName}</span>
        </span>
        <span className="truncate text-muted" title={payer}>
          {payer}
        </span>
        <div className="desktop-transaction-date min-w-0 overflow-hidden text-muted">
          <span className="block truncate">
            {fmt.txnSearchDate(`${entry.occurredOn}T12:00:00`)}
          </span>
          <RecordedTime value={entry.createdAt} />
        </div>
        <strong
          className={`text-right tabular-nums ${entry.kind === "income" ? "text-green" : "text-ink"}`}
        >
          {fmt.money(entry.amountCents, { signed: true })}
        </strong>
        <GroupRowActions
          entry={entry}
          disabled={disabled}
          archived={!!data.group.archivedAt}
          onOpen={onOpen}
          onEdit={onEdit}
          onRefund={onRefund}
        />
      </article>
    );
  return (
    <article
      data-selected={selected}
      data-highlight={recentlyEdited}
      className={`record-row cozy-transaction-row flex items-center gap-3 rounded-[14px] px-[15px] py-1.5 ${selected ? "bg-primary-soft" : "bg-card"}`}
    >
      {selecting && (
        <Checkbox
          disabled={disabled || selectionDisabled}
          checked={selected}
          onChange={onToggle}
          label={t("bulkSelectRecord", { name })}
        />
      )}
      <button
        type="button"
        className="flex min-h-14 min-w-0 flex-1 items-center gap-3 text-left"
        disabled={selecting && (disabled || selectionDisabled)}
        onClick={selecting ? onToggle : onOpen}
        aria-label={selecting ? t("bulkSelectRecord", { name }) : `${t("recordDetails")}: ${name}`}
      >
        <EntitySymbol emoji={category?.emoji ?? "🏷️"} color={category?.color} size={20} />
        <span className="min-w-0 flex-1 text-body">
          {merchant}
          <RecordSummary
            category={category?.name ?? categoryName}
            date={fmt.txnDate(`${entry.occurredOn}T12:00:00`)}
          />
          <span className="flex min-w-0 items-center gap-1.5 text-meta text-muted">
            <span className="truncate">
              {t("paidBy")} {payer}
            </span>
            <SplitBadge entry={entry} />
            {recentlyEdited && <span className="shrink-0 text-[10px]">{t("recentlyEdited")}</span>}
          </span>
          <span className="transaction-recorded-time">
            <RecordedTime value={entry.createdAt} />
          </span>
        </span>
        <strong
          className={`shrink-0 text-body tabular-nums ${entry.kind === "income" ? "text-green" : "text-ink"}`}
        >
          {fmt.money(entry.amountCents, { signed: true })}
        </strong>
      </button>
      {!selecting && (
        <GroupRowActions
          entry={entry}
          disabled={disabled}
          archived={!!data.group.archivedAt}
          onOpen={onOpen}
          onEdit={onEdit}
          onRefund={onRefund}
        />
      )}
    </article>
  );
}
function GroupRowActions({
  entry,
  disabled,
  archived,
  onOpen,
  onEdit,
  onRefund,
}: {
  entry: GroupEntry;
  disabled: boolean;
  archived: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onRefund: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const t = useTranslations("groups"),
    tx = useTranslations("txns");
  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      className="relative flex items-center justify-end"
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={tx("rowActions")}
        aria-expanded={open}
        onClick={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          setPosition({
            left: Math.max(8, box.right - 160),
            top: Math.max(8, Math.min(box.bottom + 4, window.innerHeight - 180)),
          });
          setOpen(!open);
        }}
        className="flex h-11 w-8 items-center justify-center rounded-[8px] text-muted hover:bg-track"
      >
        <MoreHorizontal size={17} />
      </button>
      {open && (
        <div
          style={position}
          className="fixed z-[70] w-40 rounded-[12px] border border-edge bg-card p-1.5 shadow-lg"
        >
          {[
            [t("recordDetails"), onOpen],
            ...(!archived
              ? [
                  [t("edit"), onEdit],
                  ...(entry.kind === "expense" ? [[t("refund"), onRefund]] : []),
                ]
              : []),
          ].map(([label, action]) => (
            <button
              key={String(label)}
              type="button"
              className="flex min-h-11 w-full items-center rounded-[8px] px-3 text-left text-[12px] text-ink hover:bg-track"
              onClick={() => {
                setOpen(false);
                (action as () => void)();
              }}
            >
              {String(label)}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}
export function GroupTransactionDetail({
  entry,
  data,
  onClose,
  onEdit,
  onRefund,
}: {
  entry: GroupEntry;
  data: GroupSnapshot;
  onClose: () => void;
  onEdit: () => void;
  onRefund: () => void;
}) {
  const t = useTranslations("groups"),
    fmt = useFormatters();
  const member = (id: string | null) =>
    data.members.find((m) => m.id === id)?.name ?? t("sharedFunds");
  return (
    <Modal title={entry.merchant || t(entry.kind)} onClose={onClose}>
      <div className="space-y-4 text-[13px]">
        <p className="text-2xl font-bold tabular-nums">
          {fmt.money(entry.amountCents, { signed: true })}
        </p>
        <p>
          {t(entry.kind)} · {fmt.txnSearchDate(`${entry.occurredOn}T12:00:00`)}
        </p>
        <p>{groupCategoryLabel(data.categories, entry.categoryId) || t("uncategorized")}</p>
        <p>
          {t("paidBy")} · {member(entry.payerId)}
        </p>
        {entry.note && <p className="whitespace-pre-wrap">{entry.note}</p>}
        <p className="text-muted">
          {t("recordedBy")} · {member(entry.authorId)}
          <RecordedTime value={entry.createdAt} />
        </p>
        {entry.updatedAt && entry.version > 0 && (
          <p className="text-muted">
            {t("lastEdited")} · {new Date(entry.updatedAt).toLocaleString(fmt.locale)}
          </p>
        )}
        {entry.shares.length > 0 && (
          <div className="space-y-2 border-t border-edge pt-3">
            <SplitBadge entry={entry} />
            {entry.shares.map((share) => (
              <div key={share.memberId} className="flex justify-between">
                <span>{member(share.memberId)}</span>
                <span>{fmt.money(share.amountCents)}</span>
              </div>
            ))}
          </div>
        )}
        {!data.group.archivedAt && (
          <div className="flex gap-2">
            <button type="button" className={primaryClass} onClick={onEdit}>
              {t("edit")}
            </button>
            {entry.kind === "expense" && (
              <button type="button" className={buttonClass} onClick={onRefund}>
                {t("refund")}
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
