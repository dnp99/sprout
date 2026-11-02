"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/overlays";

/** A compact search entry preserves list space; the shared modal supplies
 * focus trapping, Escape dismissal and the active ledger's palette. */
export function SearchDialog({
  query,
  onQueryChange,
  children,
  disabled = false,
  shortcut = false,
  placeholder,
  label,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  children?: ReactNode;
  disabled?: boolean;
  shortcut?: boolean;
  placeholder?: string;
  label?: string;
}) {
  const t = useTranslations("txns");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!shortcut || disabled) return;
    const show = (event: KeyboardEvent) => {
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
        setOpen(true);
      }
    };
    window.addEventListener("keydown", show);
    return () => window.removeEventListener("keydown", show);
  }, [shortcut, disabled]);
  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        aria-label={t("searchPlaceholder")}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`inline-flex h-11 ${label ? "gap-2 px-3 text-[13px] font-semibold" : "w-11"} flex-none items-center justify-center rounded-[10px] border border-edge ${query ? "bg-primary-soft text-primary" : "bg-card text-muted"} hover:bg-track disabled:opacity-50`}
      >
        <Search size={17} strokeWidth={2} />
        {label}
      </button>
      {open && (
        <Modal title={t("searchPlaceholder")} onClose={() => setOpen(false)} width={360}>
          <div className="mt-3 space-y-3">
            <input
              autoFocus
              maxLength={120}
              aria-label={t("searchPlaceholder")}
              placeholder={placeholder ?? t("searchPlaceholder")}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              className="min-h-11 w-full rounded-[10px] border border-edge bg-card px-3 text-base text-ink"
            />
            {children}
          </div>
        </Modal>
      )}
    </>
  );
}
