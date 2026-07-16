import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, parseLocalePref, resolveLocale, type AppLocale } from "@/lib/locale";

/**
 * next-intl request configuration (plan 013) — the cookie-preference mode with
 * no locale URL routing. Resolved per request: the `sprout-locale-pref` cookie
 * wins; "system" (or no cookie) falls back to Accept-Language; en-CA otherwise.
 * Locale is never held in a mutable module global — Server Components read it
 * via `getLocale()`, Client Components via the provider.
 */

/** The request's preference + resolved locale, shared by the localized layout. */
export async function resolveRequestLocale() {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const pref = parseLocalePref(cookieStore.get(LOCALE_COOKIE)?.value);
  const locale = resolveLocale(pref, headerStore.get("accept-language"));
  return { pref, locale };
}

async function loadMessages(locale: AppLocale) {
  return (await import(`../messages/${locale}.json`)).default;
}

export default getRequestConfig(async () => {
  const { locale } = await resolveRequestLocale();
  return { locale, messages: await loadMessages(locale) };
});
