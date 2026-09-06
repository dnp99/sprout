"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

/** User-managed labels for positive transactions. Sources intentionally do not
 * share the expense-category model: a main job and a side business are income
 * dimensions, not budget envelopes. Shared by desktop and mobile Settings. */
export function IncomeSourcesPanel({ compact = false }: { compact?: boolean }) {
  const { incomeSources, saveIncomeSource, removeIncomeSource } = useStore(
    useShallow((s) => ({
      incomeSources: s.incomeSources,
      saveIncomeSource: s.saveIncomeSource,
      removeIncomeSource: s.removeIncomeSource,
    })),
  );
  const t = useTranslations("settingsPage.incomeSources");
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("💰");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    setError("");
    try {
      await saveIncomeSource({ name: trimmed, emoji: emoji.trim() || "💰" });
      setName("");
      setEmoji("💰");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={compact ? "" : "rounded-[14px] border border-edge bg-card p-5"}>
      <div>
        <h2 className="text-[16px] font-bold text-ink">{t("title")}</h2>
        <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-muted">{t("intro")}</p>
      </div>

      <div className="mt-4 space-y-2">
        {incomeSources.map((source) => (
          <div
            key={source.id}
            className="flex min-h-11 items-center gap-3 rounded-[10px] border border-edge bg-card px-3"
          >
            <span aria-hidden className="text-[17px]">
              {source.emoji}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">
              {source.name}
            </span>
            <button
              type="button"
              onClick={() => void removeIncomeSource(source.id)}
              aria-label={t("delete", { name: source.name })}
              className="flex h-9 w-9 items-center justify-center rounded-[8px] text-muted transition hover:bg-primary-soft hover:text-primary-dark"
            >
              <Trash2 size={15} strokeWidth={2} />
            </button>
          </div>
        ))}
        {incomeSources.length === 0 && (
          <p className="rounded-[10px] border border-dashed border-edge px-3 py-3 text-[12.5px] font-medium text-muted">
            {t("empty")}
          </p>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={emoji}
          onChange={(event) => setEmoji(event.target.value)}
          aria-label={t("emoji")}
          maxLength={8}
          className="w-12 rounded-[10px] border border-edge bg-card px-2 text-center text-[15px] outline-none focus:border-primary"
        />
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void add();
          }}
          maxLength={60}
          placeholder={t("placeholder")}
          className="min-w-0 flex-1 rounded-[10px] border border-edge bg-card px-3 py-2 text-[13px] font-medium text-ink outline-none placeholder:text-muted focus:border-primary"
        />
        <button
          type="button"
          onClick={() => void add()}
          disabled={busy || !name.trim()}
          className="flex min-h-11 items-center gap-1.5 rounded-[10px] bg-primary px-3 text-[12.5px] font-semibold text-onprimary disabled:opacity-50"
        >
          <Plus size={15} strokeWidth={2} /> {t("add")}
        </button>
      </div>
      {error && <p className="mt-2 text-[12px] font-medium text-primary-dark">{error}</p>}
    </section>
  );
}
