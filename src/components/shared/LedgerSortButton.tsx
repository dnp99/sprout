"use client";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
/** Both ledger tables share the same sortable-column affordance and accessible state. */
export function LedgerSortButton({
  label,
  active,
  direction,
  onClick,
  className = "",
  title,
}: {
  label: string;
  active: boolean;
  direction: "asc" | "desc";
  onClick: () => void;
  className?: string;
  title: string;
}) {
  const Icon = active ? (direction === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex items-center gap-1 ${active ? "text-ink" : ""} ${className}`}
    >
      {label.toUpperCase()}
      <Icon size={11} strokeWidth={2.5} className={active ? "" : "opacity-70"} aria-hidden="true" />
    </button>
  );
}
