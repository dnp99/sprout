"use client";

import { Loader2, Plus, Sparkles, Tags, Trash2, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { normalizeMerchant } from "@/lib/import/normalize";
import { matchingTransactionIds } from "@/lib/rules/match";
import { useStore } from "@/state/store";

interface RuleView {
  id: string;
  label: string;
  pattern: string;
  categoryId: string | null;
  categoryName: string | null;
  source: "ai" | "manual";
}

/** Settings → Rules (plan 017). Manage merchant→category rules: the ones the AI
 *  learned during import and the user's own. Adding/editing a rule can also
 *  recategorize existing matching transactions. Shared by web + mobile. */
export function RulesPanel() {
  const t = useTranslations("settingsPage.rulesPanel");
  const { categories, transactions, refresh } = useStore(
    useShallow((s) => ({
      categories: s.categories,
      transactions: s.transactions,
      refresh: s.refresh,
    })),
  );

  const [rules, setRules] = useState<RuleView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [merchant, setMerchant] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [applyExisting, setApplyExisting] = useState(true);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch once on mount
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/rules");
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? t("errGeneric"));
      setRules(body.rules as RuleView[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errGeneric"));
    } finally {
      setLoading(false);
    }
  }

  // How many existing transactions the pending rule would recategorize.
  const matchCount = useMemo(
    () =>
      merchant.trim()
        ? matchingTransactionIds(transactions, normalizeMerchant(merchant)).length
        : 0,
    [merchant, transactions],
  );

  const catName = (id: string | null) =>
    id ? (categories.find((c) => c.id === id)?.name ?? null) : null;

  async function create() {
    if (!merchant.trim() || !categoryId) return;
    setCreating(true);
    setMsg(null);
    setError("");
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ merchant, categoryId, apply: applyExisting }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? t("errGeneric"));
      setMerchant("");
      setCategoryId("");
      if (body.applied > 0) {
        setMsg(t("appliedN", { count: body.applied }));
        await refresh();
      } else {
        setMsg(t("ruleSaved"));
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errGeneric"));
    } finally {
      setCreating(false);
    }
  }

  async function changeCategory(id: string, newCategoryId: string) {
    const prev = rules;
    setRules((rs) =>
      rs.map((r) =>
        r.id === id
          ? {
              ...r,
              categoryId: newCategoryId,
              categoryName: catName(newCategoryId),
              source: "manual",
            }
          : r,
      ),
    );
    const res = await fetch(`/api/rules/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ categoryId: newCategoryId }),
    });
    if (!res.ok) setRules(prev); // revert on failure
  }

  async function remove(id: string) {
    const prev = rules;
    setRules((rs) => rs.filter((r) => r.id !== id));
    const res = await fetch(`/api/rules/${id}`, { method: "DELETE" });
    if (!res.ok) setRules(prev);
  }

  return (
    <div className="rounded-[14px] border border-edge bg-card p-5">
      <div className="flex items-center gap-2">
        <Tags size={16} strokeWidth={2} className="text-primary" />
        <h3 className="text-[15px] font-bold text-ink">{t("title")}</h3>
      </div>
      <p className="mt-1.5 text-[12.5px] font-medium leading-relaxed text-muted">{t("intro")}</p>

      {/* Add a rule */}
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="min-w-[150px] flex-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted">
            {t("merchant")}
          </span>
          <input
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder={t("merchantPlaceholder")}
            className="mt-1 w-full rounded-[10px] border border-edge bg-track px-3 py-2 text-[13.5px] font-medium text-ink outline-none transition focus:border-primary"
          />
        </label>
        <label className="min-w-[150px] flex-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted">
            {t("category")}
          </span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 w-full rounded-[10px] border border-edge bg-track px-3 py-2 text-[13.5px] font-medium text-ink outline-none transition focus:border-primary"
          >
            <option value="">{t("pickCategory")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={create}
          disabled={creating || !merchant.trim() || !categoryId}
          className="flex h-[38px] flex-none items-center gap-1.5 rounded-[10px] bg-primary px-3.5 text-[12.5px] font-semibold text-onprimary disabled:opacity-50"
        >
          {creating ? (
            <Loader2 size={14} strokeWidth={2.4} className="animate-spin" />
          ) : (
            <Plus size={14} strokeWidth={2.6} />
          )}
          {t("addRule")}
        </button>
      </div>
      <label className="mt-2 flex items-center gap-2 text-[12.5px] font-medium text-muted">
        <input
          type="checkbox"
          checked={applyExisting}
          onChange={(e) => setApplyExisting(e.target.checked)}
          className="h-4 w-4 accent-[var(--primary)]"
        />
        {merchant.trim() && matchCount > 0
          ? t("applyExistingN", { count: matchCount })
          : t("applyExisting")}
      </label>
      {error && <p className="mt-2 text-[12.5px] font-semibold text-primary-dark">{error}</p>}
      {msg && <p className="mt-2 text-[12.5px] font-semibold text-green">{msg}</p>}

      {/* Existing rules */}
      <div className="mt-5 border-t border-edge pt-3">
        {loading ? (
          <p className="py-2 text-[12.5px] text-muted">{t("loading")}</p>
        ) : rules.length === 0 ? (
          <p className="py-2 text-[12.5px] text-muted">{t("empty")}</p>
        ) : (
          <div className="flex flex-col">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between gap-3 border-t border-edge py-2.5 first:border-t-0"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-track text-muted"
                    title={rule.source === "manual" ? t("sourceManual") : t("sourceAi")}
                  >
                    {rule.source === "manual" ? (
                      <User size={12} strokeWidth={2} />
                    ) : (
                      <Sparkles size={12} strokeWidth={2} />
                    )}
                  </span>
                  <span className="truncate text-[13px] font-semibold text-ink">{rule.label}</span>
                </div>
                <div className="flex flex-none items-center gap-2">
                  <select
                    value={rule.categoryId ?? ""}
                    onChange={(e) => changeCategory(rule.id, e.target.value)}
                    className="rounded-[8px] border border-edge bg-card px-2 py-1.5 text-[12.5px] font-medium text-ink outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => remove(rule.id)}
                    aria-label={t("delete")}
                    title={t("delete")}
                    className="flex h-8 w-8 flex-none items-center justify-center rounded-[8px] text-muted transition hover:bg-track hover:text-primary-dark"
                  >
                    <Trash2 size={14} strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
