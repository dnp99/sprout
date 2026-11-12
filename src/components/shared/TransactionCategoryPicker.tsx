"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDesktop } from "@/hooks/useDesktop";
import { useModalFocus } from "@/hooks/useModalFocus";
import { EntitySymbol } from "@/components/ui/EntitySymbol";
import { CategoryBranchTrigger } from "./CategoryBranchTrigger";
import { categoryLabel } from "@/lib/categories/labels";
import type { TransactionCategoryOption } from "./TransactionEntryForm";

type Props = {
  categories: TransactionCategoryOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  required: boolean;
  disabled: boolean;
  invalid: boolean;
  describedBy?: string;
  className: string;
};

/** A dedicated hierarchy browser keeps long child lists out of the entry form.
 * The native select retains form semantics and adapters; only this category
 * picker changes, rather than every shared select in the application. */
export function TransactionCategoryPicker(props: Props) {
  const [open, setOpen] = useState(false);
  const desktop = useDesktop();
  const [position, setPosition] = useState<{
    left: number;
    top: number;
    width: number;
    maxHeight: number;
  }>();
  const [context, setContext] = useState<string | undefined>();
  const dialogId = useId();
  const selected = props.categories.find((category) => category.id === props.value);
  return (
    <>
      <select
        tabIndex={-1}
        aria-hidden="true"
        aria-label={props.label}
        aria-invalid={props.invalid || undefined}
        aria-describedby={props.describedBy}
        className="hidden"
        value={props.value}
        required={props.required}
        disabled={props.disabled}
        onChange={(event) => props.onChange(event.target.value)}
      >
        <option value="">{props.placeholder}</option>
        {props.categories.map((category) => (
          <option key={category.id} value={category.id}>
            {categoryLabel(props.categories, category)}
          </option>
        ))}
      </select>
      <button
        type="button"
        role="combobox"
        aria-label={props.label}
        aria-controls={open ? dialogId : undefined}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={props.invalid || undefined}
        aria-describedby={props.describedBy}
        aria-required={props.required}
        disabled={props.disabled}
        onClick={(event) => {
          setContext(
            event.currentTarget.closest<HTMLElement>("[data-ledger-context]")?.dataset
              .ledgerContext,
          );
          const rect = event.currentTarget.getBoundingClientRect();
          const width = Math.min(Math.max(rect.width, 340), window.innerWidth - 24);
          const below = window.innerHeight - rect.bottom - 18;
          // The full-width category row leaves room for a downward menu;
          // constrain its list rather than covering earlier fields by flipping.
          const height = Math.min(360, Math.max(96, below));
          setPosition({
            left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
            top: rect.bottom + 6,
            width,
            maxHeight: height,
          });
          setOpen(true);
        }}
        className={`${props.className} flex items-center justify-between gap-2 text-left`}
      >
        <span className="truncate">
          {selected ? categoryLabel(props.categories, selected) : props.placeholder}
        </span>
        <ChevronDown size={16} className="shrink-0" aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          <CategoryDrawer
            {...props}
            onClose={() => setOpen(false)}
            context={context}
            dialogId={dialogId}
            desktop={desktop}
            position={position}
          />,
          document.body,
        )}
    </>
  );
}

function CategoryDrawer({
  categories,
  value,
  onChange,
  label,
  placeholder,
  required,
  onClose,
  context,
  dialogId,
  desktop,
  position,
}: Props & {
  onClose: () => void;
  context?: string;
  dialogId: string;
  desktop: boolean;
  position?: { left: number; top: number; width: number; maxHeight: number };
}) {
  const t = useTranslations("categoryPicker");
  const close = useTranslations("mobile");
  const ref = useRef<HTMLDivElement>(null);
  const title = useId();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(
    () =>
      new Set(
        categories.find((category) => category.id === value)?.parentId
          ? [categories.find((category) => category.id === value)!.parentId!]
          : [],
      ),
  );
  // The editor owns mobile route history. The nested picker uses its focus
  // boundary without adding a same-route navigation that resets that draft.
  useModalFocus(ref, onClose, false);
  useEffect(() => {
    // Close on viewport/background movement instead of leaving a detached menu.
    const move = (event: Event) => {
      if (desktop && !(event.target instanceof Node && ref.current?.contains(event.target)))
        onClose();
    };
    window.addEventListener("resize", move);
    window.addEventListener("scroll", move, true);
    return () => {
      window.removeEventListener("resize", move);
      window.removeEventListener("scroll", move, true);
    };
  }, [desktop, onClose]);
  const search = query.trim().toLocaleLowerCase();
  const ids = new Set(categories.map((category) => category.id));
  const parents = categories.filter(
    (category) => !category.parentId || !ids.has(category.parentId),
  );
  const matches = categories.filter((category) =>
    categoryLabel(categories, category).toLocaleLowerCase().includes(search),
  );
  const choose = (id: string) => {
    onChange(id);
    onClose();
  };
  const row = (category: TransactionCategoryOption, fullLabel = false, selectParent = false) => (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        choose(category.id);
      }}
      className="flex min-h-12 w-full min-w-0 flex-1 items-center gap-3 rounded-[10px] px-3 py-3 text-left text-control text-ink hover:bg-track focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      aria-pressed={value === category.id}
    >
      <EntitySymbol emoji={category.emoji ?? "🏷️"} />
      <span className="min-w-0 flex-1 break-words">
        {selectParent
          ? t("selectParent", { name: category.name })
          : fullLabel
            ? categoryLabel(categories, category)
            : category.name}
      </span>
      {value === category.id && (
        <Check size={16} className="shrink-0 text-primary" aria-hidden="true" />
      )}
    </button>
  );
  return (
    <div
      data-ledger-context={context}
      className={`${desktop ? "" : "modal-backdrop"} fixed inset-x-0 z-[120] flex justify-end`}
      style={{ top: "var(--app-viewport-top, 0px)", height: "var(--app-viewport-height, 100dvh)" }}
      onClick={(event) => {
        event.stopPropagation();
        onClose();
      }}
    >
      <div
        ref={ref}
        id={dialogId}
        data-transaction-category-picker=""
        role="dialog"
        aria-modal="true"
        aria-labelledby={title}
        className={`flex flex-col border-edge bg-card text-ink shadow-2xl ${desktop ? "fixed overflow-hidden rounded-[14px] border" : "h-full w-full max-w-[440px] border-l"}`}
        style={{
          ...(desktop
            ? position
            : {
                paddingTop: "env(safe-area-inset-top)",
                paddingBottom: "env(safe-area-inset-bottom)",
              }),
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex min-h-16 lg:min-h-12 shrink-0 items-center justify-between gap-3 border-b border-edge px-4">
          <h2 id={title} className="text-lg lg:text-body font-bold">
            {label}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ outlineOffset: "-2px" }}
            aria-label={close("close")}
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted hover:bg-track"
          >
            <X size={20} />
          </button>
        </header>
        <div className="ledger-inline-search shrink-0 p-4">
          <label className="ledger-search-field flex min-h-11 items-center gap-2 rounded-[10px] border border-edge bg-bg px-3">
            <Search size={18} className="shrink-0 text-muted" aria-hidden="true" />
            <input
              type="search"
              data-initial-focus={desktop ? "" : undefined}
              aria-label={t("search")}
              placeholder={t("search")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="ledger-search-input min-h-11 min-w-0 flex-1 bg-transparent text-control font-normal text-ink outline-none placeholder:text-muted"
            />
          </label>
          <p className="mt-2 text-meta text-muted">{t("hint")}</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          {!required && (
            <button
              type="button"
              onClick={() => choose("")}
              className="min-h-11 w-full rounded-[10px] px-3 text-left text-control text-muted hover:bg-track"
            >
              {placeholder}
            </button>
          )}
          {search
            ? matches.map((category) => <div key={category.id}>{row(category, true)}</div>)
            : parents.map((parent) => {
                const children = categories.filter((category) => category.parentId === parent.id);
                const isOpen = expanded.has(parent.id);
                return (
                  <div key={parent.id} className="border-b border-edge py-1">
                    {children.length > 0 ? (
                      <CategoryBranchTrigger
                        label={parent.name}
                        icon={<EntitySymbol emoji={parent.emoji ?? "🏷️"} />}
                        count={children.length}
                        expanded={isOpen}
                        selected={value === parent.id}
                        controls={`${title}-${parent.id}`}
                        onToggle={() =>
                          setExpanded((current) => {
                            const next = new Set(current);
                            if (next.has(parent.id)) next.delete(parent.id);
                            else next.add(parent.id);
                            return next;
                          })
                        }
                      />
                    ) : (
                      row(parent)
                    )}
                    {children.length > 0 && isOpen && (
                      <div id={`${title}-${parent.id}`} className="ml-4 border-l border-edge pl-2">
                        {row(parent, false, true)}
                        {children.map((child) => (
                          <div key={child.id}>{row(child)}</div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          {search && !matches.length && (
            <p role="status" className="py-6 text-center text-body text-muted">
              {t("empty")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
