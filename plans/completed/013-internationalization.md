# 013 — Internationalization (i18n)

**Status:** Implemented (Phases 0–3) · **Created:** 2026-07-16 · **Decisions
locked:** 2026-07-16 · **Shipped:** 2026-07-16

> **Shipped.** next-intl cookie-preference system (no URL routing), en-CA +
> fr-CA (beta), route-group split, locale-aware money/date formatting +
> `parseMoneyInput`, catalog-drift CI check, and the full user-facing string
> sweep across the app (nav, Home/Overview, Trends/Cash-flow, Goals, Bills,
> Import/Export, Settings, Add/Edit flows, auth, mobile residuals). Standing doc:
> [`docs/i18n.md`](../../docs/i18n.md). Intentionally English: the `(public)`
> marketing/legal pages and the technical Siri/WhatsApp capture setup guide.

## Outcome

Let Sprout speak more than hard-coded English: a locale system that translates
the app's UI copy, and formats money/dates per locale, without forking components
per language. v1 ships **English (default) + one additional locale** to prove the
whole pipeline end-to-end; adding a third language after that should be
translation work only, not engineering.

## Goal

Today Sprout has **no i18n at all**:

- No locale files, no translation library, no language setting.
- All user-facing copy is hard-coded English across ~92 component files
  (labels, empty states, buttons, aria-labels, toasts, error messages).
- 17 call sites hard-code a locale into formatting:
  [`formatMoney`](../src/lib/format.ts) pins `en-CA`/`CAD` (chosen so CAD renders
  a plain `$`), and `toLocaleDateString("en-US", …)` is sprinkled through
  `trends.ts`, `reports.ts`, `bills.ts`-adjacent labels, headers, and steppers.
- Some display strings are built **server-side**: transaction `dateLabel`
  ([`transactions/dto.ts`](../src/lib/transactions/dto.ts)) and the summary's
  `monthLabel` ([`transactions/repository.ts`](../src/lib/transactions/repository.ts))
  arrive pre-formatted from the API, so the client can't reformat them for a
  different locale.
- English sentences are also composed inside **pure libs** — the budget-hero
  coach copy ([`budget-hero.ts`](../src/lib/budget-hero.ts)), report labels
  ([`reports.ts`](../src/lib/reports.ts)), import summaries, and auth/validation
  error messages — not just in components.

## Product decisions (locked 2026-07-16)

### 1. Locale = a user preference, not a URL

Sprout's app is an authenticated dashboard with fixed routes (`/home`,
`/trends`, …), not a content site. v1 stores language as a device/browser
preference:

- A `sprout-locale-pref` cookie is the **only persisted source of truth**. Its
  values are `"system" | "en-CA" | "fr-CA"`; there is no second localStorage
  copy that can disagree with SSR.
- The store holds the cookie preference as `localePref` plus the request-resolved
  `locale`. The localized root layout passes both initial values to the client
  provider, so hydration starts in the same language the server rendered.
- Settings → **Language** shows `System · English · Français (bêta)`. Changing it
  writes the cookie, updates the client store, and calls `router.refresh()` so
  Server Components and Client Components immediately agree.
- "System" is resolved from `Accept-Language` on every server request, with
  `en-CA` as the fallback. The client does not maintain a competing
  `navigator.language` value; browser-language changes take effect on the next
  request/refresh.
- **No `/fr/...` URL prefixes in v1.** SEO-visible locale routing matters only
  for the public marketing pages, which stay English in v1 (see Non-goals);
  revisit prefixes when marketing content is translated.

### 2. Second locale: `fr-CA`

French (Canada) is the natural fit — the app is CAD-denominated on a `.ca`
domain, and `fr-CA` exercises everything hard: accents, different date order,
`4 958,02 $` money formatting (symbol after, comma decimals), and longer strings
that stress layouts.

### 3. Currency stays CAD; only *formatting* localizes

Multi-currency is a different feature (schema + FX). i18n changes how the same
CAD cents are *displayed* per locale, nothing about how money is stored.

### 4. Library: `next-intl`

The de-facto standard for Next.js App Router. Works in server and client
components, ICU message format (plurals/interpolation built in), supports the
"no i18n routing" cookie mode that decision #1 needs. Alternatives (react-i18next,
Lingui) fight the App Router more.

### 5. Keys are semantic, catalogs are per-locale JSON

`src/messages/en-CA.json` + `src/messages/fr-CA.json`, namespaced by surface
(`nav.*`, `home.*`, `budget.*`, `trends.*`, `settings.*`, `errors.*`, …).
English is the source of truth; a missing key falls back to English rather than
crashing.

## Technical approach

### A. Locale plumbing (the foundation)

- `next-intl` request configuration reads `sprout-locale-pref` and
  `Accept-Language` **per request**. Locale is never stored in a mutable module
  global: Server Components use request-scoped `getLocale`/`getTranslations`,
  Client Components use the provider's hooks, and pure functions receive locale
  or a formatter explicitly.
- Split pages into URL-transparent route groups with separate root layouts:
  `(localized)` contains login/logout and the authenticated app routes and sets
  `<html lang>` from the resolved locale; `(public)` contains `/`, marketing,
  privacy, terms, and security and always sets `<html lang="en-CA">`. API routes
  stay outside both groups. Moving files into route groups does not alter URLs;
  crossing between the two root layouts may perform a full navigation, which is
  acceptable at the public/app boundary.
- Both root layouts reuse the same theme bootstrap and body shell helpers so
  splitting them does not duplicate the no-FOUC theme logic.
- Store gains `localePref` (`"system" | "en-CA" | "fr-CA"`) + resolved
  `locale` (`"en-CA" | "fr-CA"`). The localized layout supplies their initial
  values; Settings gets a sibling **Language** row beside Appearance.
- A no-FOUC-of-English script is unnecessary because the cookie is readable by
  the server and SSR renders the selected locale on the first response.

### B. Locale-aware formatting and parsing helpers

- `formatMoney(cents, opts)` remains the only cents-to-display boundary and
  receives `locale` explicitly; it never reads mutable global state. A thin
  `useAppFormatters()` client hook injects the provider locale while still
  delegating money conversion to `formatMoney`; Server Components pass their
  request locale directly. Currency remains `CAD`; `fr-CA` renders
  `4 958,02 $`.
- New `formatDate`-family helpers in `src/lib/format.ts` replace every inline
  `toLocaleDateString("en-US", …)` (17 sites): month labels, short dates,
  weekday names (the budget-hero payday banner builds its own weekday arrays —
  those go through `Intl.DateTimeFormat` instead).
- `formatBudgetInput(cents, locale)` and `parseMoneyInput(value, locale)` become
  a symmetric pair. Parsing discovers decimal/group separators with
  `Intl.NumberFormat(locale).formatToParts()`, normalizes regular/non-breaking
  spaces, rejects ambiguous or malformed input, and returns integer cents.
  Required tests cover `4,958.02` (`en-CA`), `4 958,02` and narrow no-break-space
  variants (`fr-CA`), whole dollars, negatives where allowed, and invalid input.
  Keypad flows that already accumulate integer cents remain unchanged.
- `ordinal()` / `dueLabel()` / `recurringFrequencyLabel()` in
  [`bills.ts`](../src/lib/bills.ts) become message-based (ICU select/plural) —
  "Monthly · 1st" does not translate structurally.

### C. Server-formatted strings become client-formatted

The API should return **data, not prose**:

- `dateLabel` leaves the transaction DTO — components format `occurredAt`
  with the shared date helpers. (`dateLabel` stays in the type temporarily as a
  deprecated fallback until all consumers migrate.)
- `monthLabel` leaves the summary — clients derive it from the month key.
- Audit remaining API `message:` strings ([`http.ts`](../src/lib/http.ts),
  validation errors): v1 keeps *server* errors English but maps known error
  `code`s to translated client copy; free-text messages display as-is.

### D. Pure-lib copy returns keys, not sentences

The deepest refactor. View-models that today compose English —
[`budget-hero.ts`](../src/lib/budget-hero.ts) (coach pill + sentence),
[`reports.ts`](../src/lib/reports.ts) (`rangeLabel`, `periodLabel`),
[`overview-comparison.ts`](../src/lib/overview-comparison.ts), import summaries —
switch to returning `{ key, params }` descriptors; components translate at the
edge. Keeps the libs pure and unit-testable (assert on keys/params, not prose).

### E. Translation workflow

- English catalog extracted first (that pass is also a copy audit).
- `fr-CA` translated once at the end of each phase (machine-first, human-review
  later is acceptable for v1 — flag it in Settings as beta if unreviewed).
- A CI check (script, like `check-es-compat`) fails when catalogs drift:
  keys present in `en.json` but missing in other locales.

## UI slices

- **Phase 0 — plumbing.** Route-group split; next-intl + request-scoped
  cookie/locale resolution; `localePref` in store + Settings Language row;
  catalogs skeleton; locale-aware money formatting/parsing and date helpers
  behind the scenes (English-only output identical to today). Zero visible
  change; everything after this is mechanical.
- **Phase 1 — app chrome + money screens.** Nav/tab bars, Home/Overview
  (incl. budget-hero coach copy via descriptor refactor), Budget, Transactions
  list + add flow. The `dateLabel`/`monthLabel` server→client move lands here.
- **Phase 2 — the rest of the app.** Trends/Cash flow, Goals, Bills & recurring,
  Import/Export, Settings, modals/sheets, empty states, toasts, aria-labels;
  error-code mapping. App is fully switchable end-to-end.
- **Phase 3 — QA + polish.** Full `fr-CA` pass on both surfaces (long-string
  layout breaks, truncation, `44px` targets), catalog-drift CI check, docs.

## New / touched files

- **New:** `src/i18n/` (request config, provider glue), `src/messages/en-CA.json`,
  `src/messages/fr-CA.json`, `scripts/check-i18n-catalogs.mjs`,
  `docs/i18n.md` (standing doc once shipped).
- **Touched (heavily):** nearly every file in `src/components/`;
  `src/lib/format.ts`, `trends.ts`, `reports.ts`, `bills.ts`, `budget-hero.ts`,
  `overview-comparison.ts`, `transactions/dto.ts`, `transactions/repository.ts`;
  `src/state/{types,initial,store}`; `src/app` route placement/root layouts;
  Settings screens.

## Risks

- **Sheer surface area** — hundreds of strings across 92 components. Mitigation:
  phase by screen, never a big-bang; the Phase 0 helpers make each subsequent
  edit mechanical.
- **Layout breakage from longer strings** — French runs ~15–25% longer; compact
  mobile pills/footers (e.g. the hero's `NET` cell, 44px chips) are the risk
  spots. Phase 3 exists for exactly this.
- **Server/client locale drift** — the cookie is the sole persisted preference;
  the localized layout initializes the provider and store from the same
  request-scoped resolution. Locale switching refreshes the route before the
  new server-rendered tree is considered settled.
- **Localized input ambiguity** — French grouping spaces and comma decimals can
  corrupt money if parsed with English rules. Formatting/parsing are symmetric,
  malformed input is rejected instead of guessed, and integer-cents tests gate
  both supported locales.
- **Translation quality** — machine-first `fr-CA` may read awkward; ship behind
  a "beta" tag in Settings until reviewed.
- **es-compat** — `next-intl` runtime output must pass
  `scripts/check-es-compat.mjs`; verify in Phase 0 before committing to it.

## Decisions (locked 2026-07-16)

1. **Locale #2 = `fr-CA`.** CAD-denominated app on a `.ca` domain; exercises
   accents, date order, and `4 958,02 $` formatting.
2. **Machine-translated `fr-CA` ships in v1**, flagged **Français (bêta)** in the
   Settings Language row until a human review replaces the tag.
3. **NL capture stays English-only.** The WhatsApp/Siri regex parser is not
   localized in v1 (the Haiku fallback tolerates other languages incidentally,
   unvalidated). Noted in `docs/capture-api.md` when Phase 2 lands.
4. **Marketing/landing + legal pages stay English in v1.** Legal pages need
   counsel review regardless of translation; landing translation (and locale URL
   routing/hreflang) waits for a marketing decision.

## Non-goals

- multi-currency (storage stays CAD integer cents)
- URL-prefixed locale routing / hreflang SEO (until marketing translates)
- translating legal pages (needs legal review, not just translation)
- localizing WhatsApp/Siri natural-language parsing
- RTL layouts (no RTL locale planned; revisit if one is)
