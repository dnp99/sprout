/**
 * Locale model (plan 013). Sprout renders in one of `APP_LOCALES`; the user's
 * *preference* may also be "system", which resolves against the browser's
 * Accept-Language on every server request. The preference is persisted in a
 * single cookie (`LOCALE_COOKIE`) — no localStorage copy that could disagree
 * with what the server rendered. Pure helpers only; no next.js imports so both
 * the request config and unit tests can use them.
 */

export const APP_LOCALES = ["en-CA", "fr-CA"] as const;
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

/** Resolve an Accept-Language header to a supported locale. Only the primary
 *  language subtag matters (fr-FR → fr-CA: we have one French). */
export function localeFromAcceptLanguage(header: string | undefined | null): AppLocale {
  if (!header) return DEFAULT_LOCALE;
  // Entries arrive quality-ordered ("fr-CA,fr;q=0.9,en;q=0.8") — first match wins.
  for (const part of header.split(",")) {
    const lang = part.split(";")[0].trim().toLowerCase();
    if (lang.startsWith("fr")) return "fr-CA";
    if (lang.startsWith("en")) return "en-CA";
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
