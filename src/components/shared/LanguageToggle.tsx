"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { writeLocalePrefCookie, type LocalePref } from "@/lib/locale";
import { useStore } from "@/state/store";

/** System / English / Français segmented control (plan 013), shared by the web
 *  and mobile Settings. Changing it writes the `sprout-locale-pref` cookie —
 *  the only persisted source of truth — then refreshes the router so Server
 *  Components re-render in the new language; `LocaleSync` carries the fresh
 *  values into the store. `compact` tightens it for the mobile row. */
export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("settings.language");
  const localePref = useStore((s) => s.localePref);
  const set = useStore((s) => s.set);
  const router = useRouter();

  const choose = (pref: LocalePref) => {
    writeLocalePrefCookie(pref);
    // Optimistic: an explicit pick resolves to itself; "system" resolves on the
    // server (Accept-Language), which LocaleSync mirrors back after refresh.
    set(pref === "system" ? { localePref: pref } : { localePref: pref, locale: pref });
    router.refresh();
  };

  const options: { value: LocalePref; label: string }[] = [
    { value: "system", label: t("system") },
    { value: "en-CA", label: t("en-CA") },
    { value: "fr-CA", label: t("fr-CA") },
  ];

  return (
    <div className={`flex rounded-[10px] bg-track ${compact ? "gap-0.5 p-0.5" : "gap-1 p-1"}`}>
      {options.map((option) => {
        const active = option.value === localePref;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => choose(option.value)}
            className={`rounded-lg font-semibold transition ${
              compact ? "px-2 py-1.5 text-[11px]" : "px-2.5 py-1 text-[12px]"
            } ${active ? "bg-card text-ink shadow-sm" : "text-muted"}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
