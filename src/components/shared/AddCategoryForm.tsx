"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Category } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";

// Category icons — a broad, budgeting-oriented emoji set (the first entry is the
// default). Any emoji is valid server-side; this is just the picker palette.
const ICONS = [
  "🏷️",
  "🌟",
  "🎉",
  "📱",
  "🏃",
  "🐶",
  "☕",
  "🎁",
  "🚕",
  "🩺",
  "📚",
  "🏠",
  "🛒",
  "🍔",
  "🍕",
  "🍜",
  "🍷",
  "🍰",
  "🥑",
  "🍺",
  "🚗",
  "⛽",
  "🚌",
  "✈️",
  "🚲",
  "🅿️",
  "💡",
  "🧾",
  "🛋️",
  "🧹",
  "🔧",
  "🌱",
  "🛍️",
  "👕",
  "🎮",
  "🎬",
  "🎵",
  "💻",
  "🎨",
  "⚽",
  "💰",
  "🏦",
  "🐷",
  "📈",
  "💳",
  "🎯",
  "🎓",
  "💼",
  "🐱",
  "🧸",
  "🍼",
  "🧘",
  "💇",
  "💊",
  "💪",
  "✂️",
  "🧳",
  "🏖️",
  "🗺️",
];

// Category accent colors — a muted palette spanning the spectrum. Category colors
// are dynamic per-row data (the one exception to the token rule), so these are
// intentionally raw hex applied via `style`.
const COLORS = [
  "#c98a5a",
  "#d97a54",
  "#e7a34a",
  "#7e9b6b",
  "#9a7b5a",
  "#c25b3a",
  "#5a9e6f",
  "#8a9a3a",
  "#4a9d9d",
  "#5b83b0",
  "#4a6fa5",
  "#7a6bb0",
  "#a06ba8",
  "#c76b9a",
  "#d98a8a",
  "#8a6d4a",
  "#7d8590",
  "#5f6b7a",
];

/** Create or edit a spending category (shared by web modal + mobile screen).
 *  Passing `category` switches the form into edit mode (prefilled + Delete). */
export function AddCategoryForm({ category, onDone }: { category?: Category; onDone: () => void }) {
  const t = useTranslations("addFlow");
  const { saveCategory, removeCategory } = useStore(
    useShallow((s) => ({ saveCategory: s.saveCategory, removeCategory: s.removeCategory })),
  );
  const editing = Boolean(category);

  const [name, setName] = useState(category?.name ?? "");
  const [emoji, setEmoji] = useState(category?.emoji ?? ICONS[0]);
  const [color, setColor] = useState(category?.color ?? COLORS[0]);
  const [budget, setBudget] = useState(category ? String(category.monthlyBudgetCents / 100) : "");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!name.trim()) return setError(t("nameCategory"));
    setBusy(true);
    setError("");
    try {
      await saveCategory(
        {
          name: name.trim(),
          emoji,
          color,
          monthlyBudgetCents: Math.max(0, Math.round((Number(budget) || 0) * 100)),
        },
        category?.id,
      );
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("categorySaveError"));
      setBusy(false);
    }
  }

  async function remove() {
    if (!category) return;
    setBusy(true);
    setError("");
    try {
      await removeCategory(category.id);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("categoryDeleteError"));
      setBusy(false);
    }
  }

  return (
    <div className="mt-1 flex flex-col gap-[18px]">
      {/* Live preview + name, inline */}
      <div className="flex items-center gap-3">
        <span
          className="flex h-12 w-12 flex-none items-center justify-center rounded-[12px] text-2xl"
          style={{ background: `${color}22` }}
        >
          {emoji}
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("categoryNamePlaceholder")}
          className="min-w-0 flex-1 rounded-[10px] border border-edge bg-transparent px-3 py-2.5 text-[15px] font-semibold text-ink outline-none transition placeholder:text-subtle focus:border-primary"
        />
      </div>

      <Field label={t("pickIcon")}>
        {/* Bounded, scrollable grid so a big set stays a compact 6-up grid
            instead of stretching the modal. */}
        <div className="-mr-1 max-h-[164px] overflow-y-auto pr-1">
          <div className="grid grid-cols-6 gap-2">
            {ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                aria-label={icon}
                aria-pressed={emoji === icon}
                onClick={() => setEmoji(icon)}
                className={`flex aspect-square items-center justify-center rounded-[12px] border-[1.5px] text-[20px] transition ${
                  emoji === icon
                    ? "border-primary bg-primary-soft"
                    : "border-edge hover:border-muted"
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </Field>

      <Field label={t("color")}>
        <div className="flex flex-wrap gap-2.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`color ${c}`}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
              className="h-9 w-9 rounded-full transition"
              // Selected: a ring in the swatch's own color with a surface-colored
              // gap, so it reads correctly in both themes.
              style={{
                background: c,
                boxShadow: color === c ? `0 0 0 2px var(--bg), 0 0 0 4px ${c}` : undefined,
              }}
            />
          ))}
        </div>
      </Field>

      <Field label={t("monthlyBudget")}>
        <div className="flex items-center gap-1.5 rounded-[10px] border border-edge px-3 py-2.5 transition focus-within:border-primary">
          <span className="text-[14px] font-semibold text-muted">$</span>
          <input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            className="w-full bg-transparent text-[14px] font-semibold text-ink outline-none placeholder:text-subtle"
          />
          <span className="text-[12px] font-medium text-muted">/mo</span>
        </div>
      </Field>

      {error && <div className="text-[13px] font-semibold text-primary">{error}</div>}

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="w-full rounded-[10px] bg-primary py-3 text-center text-[14px] font-semibold text-onprimary transition disabled:opacity-50"
        >
          {busy ? t("saving") : editing ? t("saveChanges") : t("createCategory")}
        </button>

        {editing && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={busy}
            className="w-full text-center text-[13px] font-semibold text-primary transition hover:text-primary-dark disabled:opacity-50"
          >
            Delete category
          </button>
        )}
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={t("deleteCategoryTitle")}
          message={`“${category?.name}”'s transactions become uncategorized.`}
          busy={busy}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}

/** Uppercase section label + its control, matching the design's dialog fields. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10.5px] font-bold uppercase tracking-[.05em] text-muted">
      {children}
    </span>
  );
}
