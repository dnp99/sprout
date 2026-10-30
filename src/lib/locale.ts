/**
 * Locale model (plan 013). Sprout renders in one of `APP_LOCALES`; the user's
 * *preference* may also be "system", which resolves against the browser's
 * Accept-Language on every server request. The preference is persisted in a
 * single cookie (`LOCALE_COOKIE`) — no localStorage copy that could disagree
 * with what the server rendered. Pure helpers only; no next.js imports so both
 * the request config and unit tests can use them.
 */

export const APP_LOCALES = ["en-CA", "fr-CA", "zh-Hans", "zh-Hant"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export type LocalePref = "system" | AppLocale;

export const DEFAULT_LOCALE: AppLocale = "en-CA";

/** The preference cookie. Value is a `LocalePref`; missing/invalid = "system". */
export const LOCALE_COOKIE = "sprout-locale-pref";

export function isAppLocale(value: unknown): value is AppLocale {
  return APP_LOCALES.includes(value as AppLocale);
}

/** Parse a cookie value into a preference, treating anything unknown as
 *  "system" so a stale/garbled cookie can never break rendering. */
export function parseLocalePref(value: string | undefined | null): LocalePref {
  if (value === "system" || isAppLocale(value)) return value;
  return "system";
}

/** Respect quality weights and Chinese script/region subtags so devices using
 * Traditional Chinese do not silently receive Simplified Chinese. */
export function localeFromAcceptLanguage(header: string | undefined | null): AppLocale {
  if (!header) return DEFAULT_LOCALE;
  const preferences = header
    .split(",")
    .map((part) => {
      const [tag, ...parameters] = part.trim().toLowerCase().split(";");
      const quality = parameters.find((parameter) => parameter.trim().startsWith("q="));
      return { tag, quality: quality ? Number(quality.trim().slice(2)) : 1 };
    })
    .filter(({ quality }) => quality > 0 && quality <= 1)
    .sort((a, b) => b.quality - a.quality);
  for (const { tag } of preferences) {
    const [language, ...subtags] = tag.split("-");
    if (language === "fr") return "fr-CA";
    if (language === "en") return "en-CA";
    if (language === "zh") {
      if (subtags.includes("hans")) return "zh-Hans";
      if (subtags.some((subtag) => ["hant", "tw", "hk", "mo"].includes(subtag))) return "zh-Hant";
      return "zh-Hans";
    }
  }
  return DEFAULT_LOCALE;
}

/** The locale a request renders in, given the cookie preference and the
 *  browser's Accept-Language. */
export function resolveLocale(
  pref: LocalePref,
  acceptLanguage: string | undefined | null,
): AppLocale {
  return pref === "system" ? localeFromAcceptLanguage(acceptLanguage) : pref;
}

/** Persist the preference cookie from the client (Settings → Language). One
 *  year; SameSite=Lax so it rides normal navigations; path=/ so every request
 *  (including RSC refreshes) sees it. */
export function writeLocalePrefCookie(pref: LocalePref): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE}=${pref}; path=/; max-age=31536000; samesite=lax`;
}
