"use client";

import { Select } from "@/components/ui/Select";

import { useState } from "react";
import { CategoryIdentityFields } from "./CategoryIdentityFields";
import { CategoryDeleteButton } from "./CategoryDeleteButton";
import { formatBudgetInput, parseMoneyInput } from "@/lib/format";
import { EMOJI_ICON_OPTIONS } from "@/components/shared/EmojiIconPicker";
import type { BudgetGroupPreference, Category } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";

// Category accent colors — a muted palette spanning the spectrum. Category colors
// are dynamic per-row data (the one exception to the token rule), so these are
// intentionally raw hex applied via `style`.
const COLORS = ["#c98a5a"];

/** Create or edit a spending category (shared by web modal + mobile screen).
 *  Passing `category` switches the form into edit mode (prefilled + Delete). */
export function AddCategoryForm({ category, onDone }: { category?: Category; onDone: () => void }) {
  const t = useTranslations("addFlow");
  const { saveCategory, removeCategory } = useStore(
    useShallow((s) => ({ saveCategory: s.saveCategory, removeCategory: s.removeCategory })),
  );
  const editing = Boolean(category);
  const locale = useStore((s) => s.locale);

  const [name, setName] = useState(category?.name ?? "");
  const [emoji, setEmoji] = useState(category?.emoji ?? EMOJI_ICON_OPTIONS[0]);
  const [color, setColor] = useState(category?.color ?? COLORS[0]);
  const [budget, setBudget] = useState(
    category ? formatBudgetInput(category.monthlyBudgetCents, locale) : "",
  );
  const [budgetGroup, setBudgetGroup] = useState<BudgetGroupPreference | "automatic">(
    category?.budgetGroup ?? (category ? "automatic" : "flexible"),
  );
  const [busy, setBusy] = useState(false);
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
          monthlyBudgetCents: Math.max(0, parseMoneyInput(budget, locale) ?? 0),
          budgetGroup: budgetGroup === "automatic" ? null : budgetGroup,
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
      <CategoryIdentityFields
        name={name}
        emoji={emoji}
        color={color}
        onName={setName}
        onEmoji={setEmoji}
        onColor={setColor}
        disabled={busy}
      />
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

      <Field label={t("budgetGroup")}>
        <Select
          aria-label={t("budgetGroup")}
          value={budgetGroup}
          onChange={(event) =>
            setBudgetGroup(event.target.value as BudgetGroupPreference | "automatic")
          }
          className="w-full rounded-[10px] border border-edge bg-card px-3 py-2.5 text-[14px] font-semibold text-ink outline-none transition focus:border-primary"
        >
          {category && <option value="automatic">{t("budgetGroupAutomatic")}</option>}
          <option value="fixed">{t("budgetGroupFixed")}</option>
          <option value="flexible">{t("budgetGroupFlexible")}</option>
        </Select>
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
      </div>
      {editing && <CategoryDeleteButton disabled={busy} onDelete={() => void remove()} />}
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
