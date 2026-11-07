"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";

/** Inline live search keeps results visible. The historical export name remains
 * for callers; advanced filters are a disclosure, never a blocking dialog. */
export function SearchDialog({
  query,
  onQueryChange,
  children,
  disabled = false,
  shortcut = false,
  placeholder,
  activeFilters = [],
}: {
  query: string;
  onQueryChange: (query: string) => void;
  children?: ReactNode;
  disabled?: boolean;
  shortcut?: boolean;
  placeholder?: string;
  activeFilters?: { id: string; label: string; onClear: () => void }[];
}) {
  const t = useTranslations("txns");
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => {
    if (!shortcut || disabled) return;
    const focus = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !document.querySelector('[role="dialog"]') &&
        !(
          target instanceof HTMLElement &&
          (target.matches("input,textarea,select") || target.isContentEditable)
        )
      ) {
        event.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", focus);
    return () => window.removeEventListener("keydown", focus);
  }, [shortcut, disabled]);
  return (
    <div className="ledger-inline-search min-w-0 flex-1">
      <div className="flex min-w-0 items-center gap-2">
        <div className="ledger-search-field flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-edge bg-card px-3 focus-within:border-primary">
          <Search size={17} className="shrink-0 text-muted" aria-hidden="true" />
          <input
            ref={input}
            type="search"
            maxLength={120}
            disabled={disabled}
            aria-label={t("searchPlaceholder")}
            placeholder={placeholder ?? t("searchPlaceholder")}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="ledger-search-input min-h-11 min-w-0 flex-1 border-0 bg-transparent text-control text-ink outline-none placeholder:text-muted"
          />
          {query && (
            <button
              type="button"
              disabled={disabled}
              aria-label={t("clearSearch")}
              onClick={() => {
                onQueryChange("");
                input.current?.focus();
              }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] text-muted hover:bg-track"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {children && (
          <button
            type="button"
            disabled={disabled}
            aria-label={
              activeFilters.length
                ? t("activeFilters", { count: activeFilters.length })
                : t("filters")
            }
            aria-expanded={filtersOpen}
            aria-controls={`${id}-filters`}
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-edge ${filtersOpen ? "bg-primary-soft text-primary" : "bg-card text-muted"}`}
          >
            <SlidersHorizontal size={17} />
            {activeFilters.length > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-onprimary"
              >
                {activeFilters.length}
              </span>
            )}
          </button>
        )}
      </div>
      {activeFilters.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              disabled={disabled}
              onClick={filter.onClear}
              aria-label={t("removeFilter", { label: filter.label })}
              className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-edge bg-primary-soft px-3 text-control text-ink"
            >
              <span className="truncate">{filter.label}</span>
              <X size={14} className="shrink-0" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
      {filtersOpen && (
        <div
          id={`${id}-filters`}
          className="mt-2 space-y-3 rounded-[14px] border border-edge bg-card p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-semibold">{t("filters")}</span>
            <button
              type="button"
              aria-label={t("close")}
              onClick={() => setFiltersOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-[8px] text-muted hover:bg-track"
            >
              <X size={16} />
            </button>
          </div>
          {children}
        </div>
      )}
    </div>
  );
}
