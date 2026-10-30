"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { writeLocalePrefCookie, type LocalePref } from "@/lib/locale";
import { useStore } from "@/state/store";
import { Select } from "@/components/ui/Select";

/** Language picker shared by the web
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
    { value: "zh-Hans", label: "简体中文" },
    { value: "zh-Hant", label: "繁體中文" },
  ];

  return (
    <Select
      aria-label={t("title")}
      value={localePref}
      onChange={(event) => choose(event.target.value as LocalePref)}
      className={`min-h-11 rounded-[10px] border border-edge bg-track px-3 text-ink ${
        compact ? "max-w-[180px] text-[12px]" : "min-w-[180px] text-[13px]"
      }`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}
