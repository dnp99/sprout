"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

/** Manage cross-cutting business labels. A business is deliberately independent
 * from categories and income sources: it can be assigned to either type of
 * transaction without changing the user's personal budget structure. */
export function BusinessesPanel({ compact = false }: { compact?: boolean }) {
  const { businesses, saveBusiness, removeBusiness } = useStore(
    useShallow((s) => ({
      businesses: s.businesses,
      saveBusiness: s.saveBusiness,
      removeBusiness: s.removeBusiness,
    })),
  );
  const t = useTranslations("settingsPage.businesses");
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("💼");
  const [color, setColor] = useState("#c98a5a");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    setError("");
    try {
      await saveBusiness({ name: trimmed, emoji: emoji.trim() || "💼", color });
      setName("");
      setEmoji("💼");
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
        {businesses.map((business) => (
          <BusinessRow key={business.id} business={business} />
        ))}
        {businesses.length === 0 && (
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
          type="color"
          value={color}
          onChange={(event) => setColor(event.target.value)}
          aria-label={t("color")}
          className="h-11 w-11 rounded-[10px] border border-edge bg-card p-1"
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

function BusinessRow({
  business,
}: {
  business: { id: string; name: string; emoji: string; color: string };
}) {
  const { saveBusiness, removeBusiness } = useStore(
    useShallow((s) => ({ saveBusiness: s.saveBusiness, removeBusiness: s.removeBusiness })),
  );
  const t = useTranslations("settingsPage.businesses");
  const [name, setName] = useState(business.name);

  async function rename() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === business.name) {
      setName(business.name);
      return;
    }
    await saveBusiness(
      {
        name: trimmed,
        emoji: business.emoji,
        color: business.color,
      },
      business.id,
    );
  }

  return (
    <div className="flex min-h-11 items-center gap-3 rounded-[10px] border border-edge bg-card px-3">
      <span
        aria-hidden
        className="h-2.5 w-2.5 flex-none rounded-full"
        style={{ backgroundColor: business.color }}
      />
      <span aria-hidden className="text-[17px]">
        {business.emoji}
      </span>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={() => void rename()}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
          if (event.key === "Escape") {
            setName(business.name);
            event.currentTarget.blur();
          }
        }}
        aria-label={t("rename", { name: business.name })}
        maxLength={60}
        className="min-w-0 flex-1 bg-transparent text-[13.5px] font-semibold text-ink outline-none"
      />
      <button
        type="button"
        onClick={() => void removeBusiness(business.id)}
        aria-label={t("delete", { name: business.name })}
        className="flex h-9 w-9 items-center justify-center rounded-[8px] text-muted transition hover:bg-primary-soft hover:text-primary-dark"
      >
        <Trash2 size={15} strokeWidth={2} />
      </button>
    </div>
  );
}
