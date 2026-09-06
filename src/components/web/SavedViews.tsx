"use client";

import { Bookmark, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import type { SortDir, SortKey } from "@/lib/search";
import type { SavedView, ViewFilters } from "@/lib/views/types";
import type { TxnFilter } from "@/lib/types";
import { useStore } from "@/state/store";
import { Popover } from "@/components/ui/Popover";

/** Saved-views control for the Transactions toolbar (plan 017 B2): save the
 *  current filter set as a named view and recall / rename / delete it. Views are
 *  server-persisted so they sync across devices. */
export function SavedViews({ mobile = false }: { mobile?: boolean }) {
  const t = useTranslations("txns");
  const store = useStore(
    useShallow((s) => ({
      webTxnType: s.webTxnType,
      txnCategory: s.txnCategory,
      webTxnCategoryIds: s.webTxnCategoryIds,
      searchQuery: s.searchQuery,
      searchType: s.searchType,
      searchCategoryIds: s.searchCategoryIds,
      searchDateFrom: s.searchDateFrom,
      searchDateTo: s.searchDateTo,
      searchAmountMin: s.searchAmountMin,
      searchAmountMax: s.searchAmountMax,
      webTxnQuery: s.webTxnQuery,
      webDateFrom: s.webDateFrom,
      webDateTo: s.webDateTo,
      webAmountMin: s.webAmountMin,
      webAmountMax: s.webAmountMax,
      webSortKey: s.webSortKey,
      webSortDir: s.webSortDir,
      set: s.set,
    })),
  );

  const [open, setOpen] = useState(false);
  const [views, setViews] = useState<SavedView[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/views");
      const body = await res.json().catch(() => ({}));
      if (res.ok) setViews(body.views as SavedView[]);
    } catch {
      /* non-fatal */
    }
  }

  // Load on first open (no effect — the newer react-hooks lint dislikes
  // effect-driven fetches; loading on the user action is clearer anyway).
  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && views.length === 0) void load();
  }

  const currentFilters = (): ViewFilters => ({
    type: mobile ? store.searchType : store.webTxnType,
    categoryId: mobile ? "all" : store.txnCategory,
    categoryIds: mobile ? store.searchCategoryIds : store.webTxnCategoryIds,
    query: mobile ? store.searchQuery : store.webTxnQuery,
    dateFrom: mobile ? store.searchDateFrom : store.webDateFrom,
    dateTo: mobile ? store.searchDateTo : store.webDateTo,
    amountMin: mobile ? store.searchAmountMin : store.webAmountMin,
    amountMax: mobile ? store.searchAmountMax : store.webAmountMax,
    sortKey: mobile ? undefined : store.webSortKey,
    sortDir: mobile ? undefined : store.webSortDir,
  });

  function recall(f: ViewFilters) {
    if (mobile) {
      store.set({
        searchType: (f.type as TxnFilter) ?? "all",
        searchCategoryIds: f.categoryIds ?? [],
        searchCategoryId: f.categoryIds?.length === 1 ? f.categoryIds[0] : "all",
        searchQuery: f.query ?? "",
        searchDateFrom: f.dateFrom ?? "",
        searchDateTo: f.dateTo ?? "",
        searchAmountMin: f.amountMin ?? "",
        searchAmountMax: f.amountMax ?? "",
      });
    } else {
      store.set({
        webTxnType: (f.type as TxnFilter) ?? "all",
        txnCategory: f.categoryId ?? "all",
        webTxnCategoryIds:
          f.categoryIds ?? (f.categoryId && f.categoryId !== "all" ? [f.categoryId] : []),
        webTxnQuery: f.query ?? "",
        webDateFrom: f.dateFrom ?? "",
        webDateTo: f.dateTo ?? "",
        webAmountMin: f.amountMin ?? "",
        webAmountMax: f.amountMax ?? "",
        webSortKey: (f.sortKey as SortKey) ?? "date",
        webSortDir: (f.sortDir as SortDir) ?? "desc",
      });
    }
    setOpen(false);
  }

  async function save() {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/views", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: trimmed, filters: currentFilters() }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setViews((v) => [body.view as SavedView, ...v]);
        setName("");
      }
    } finally {
      setBusy(false);
    }
  }

  async function rename(id: string) {
    const trimmed = editName.trim();
    if (!trimmed) return setEditingId(null);
    setViews((v) => v.map((x) => (x.id === id ? { ...x, name: trimmed } : x)));
    setEditingId(null);
    await fetch(`/api/views/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
  }

  async function remove(id: string) {
    setViews((v) => v.filter((x) => x.id !== id));
    await fetch(`/api/views/${id}`, { method: "DELETE" });
  }

  return (
    <Popover open={open} onClose={() => setOpen(false)}>
      <button
        type="button"
        onClick={toggle}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border border-edge px-[13px] py-[7px] text-[12px] font-medium text-muted transition hover:text-ink ${mobile ? "bg-card" : ""}`}
      >
        <Bookmark size={13} strokeWidth={2} />
        {t("saved")}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-[280px] max-w-[calc(100vw-32px)] rounded-[14px] border border-edge bg-card p-3.5 shadow-lg">
          <div className="flex items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder={t("saveViewPlaceholder")}
              maxLength={60}
              className="h-9 min-w-0 flex-1 rounded-[8px] border border-edge bg-track px-2.5 text-[12.5px] font-medium text-ink outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={save}
              disabled={busy || !name.trim()}
              className="flex h-9 flex-none items-center gap-1 rounded-[8px] bg-primary px-3 text-[12px] font-semibold text-onprimary disabled:opacity-50"
            >
              <Plus size={13} strokeWidth={2.6} />
              {t("saveView")}
            </button>
          </div>

          <div className="mt-3 flex flex-col">
            {views.length === 0 ? (
              <p className="py-2 text-[12px] text-muted">{t("noViews")}</p>
            ) : (
              views.map((view) => (
                <div
                  key={view.id}
                  className="group flex items-center justify-between gap-2 border-t border-edge py-2 first:border-t-0"
                >
                  {editingId === view.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && rename(view.id)}
                      onBlur={() => rename(view.id)}
                      autoFocus
                      className="h-7 min-w-0 flex-1 rounded-[6px] border border-primary bg-track px-2 text-[12.5px] font-medium text-ink outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => recall(view.filters)}
                      className="min-w-0 flex-1 truncate text-left text-[12.5px] font-semibold text-ink hover:text-primary"
                    >
                      {view.name}
                    </button>
                  )}
                  <div className="flex flex-none items-center gap-0.5">
                    {editingId === view.id ? (
                      <button
                        type="button"
                        onClick={() => rename(view.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-[6px] text-primary"
                        aria-label={t("save")}
                      >
                        <Check size={13} strokeWidth={2.4} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(view.id);
                          setEditName(view.name);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-[6px] text-muted transition hover:bg-track hover:text-ink"
                        aria-label={t("rename")}
                      >
                        <Pencil size={12} strokeWidth={2} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(view.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-[6px] text-muted transition hover:bg-track hover:text-primary-dark"
                      aria-label={t("delete")}
                    >
                      <Trash2 size={12} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 flex w-full items-center justify-center gap-1 text-[11.5px] font-medium text-subtle transition hover:text-muted"
          >
            <X size={12} strokeWidth={2} />
            {t("close")}
          </button>
        </div>
      )}
    </Popover>
  );
}
