# Sprout — Design System

The **Sprout** design language is a **shadcn-hybrid** system (from the "Overview
Revised" claude.ai/design handoff): clean neutral surfaces, hairline borders, a
warm terracotta accent, restrained type, and full **light + dark** mode.

Tokens are CSS variables defined in
[`../src/app/globals.css`](../src/app/globals.css) and surfaced as semantic
Tailwind classes in [`../tailwind.config.ts`](../tailwind.config.ts). **Never**
hard-code hex in components — use the semantic classes. The sole exception is a
category's / goal's own dynamic accent color, passed through `style`.

## 1) Color tokens

Every token is a CSS variable, so **dark mode comes for free** — the same class
resolves to the light value under `:root` and the dark value under `.dark`.
Never fork styles by theme.

| Token (class)        | Light     | Dark      | Use                                |
| -------------------- | --------- | --------- | ---------------------------------- |
| `bg-bg`              | `#faf8f5` | `#0f0f11` | App canvas (= nav rail + header)   |
| `bg-card`            | `#ffffff` | `#141416` | Elevated card surface              |
| `bg-sidebar`         | `#faf8f5` | `#0f0f11` | Left nav rail (desktop) (= canvas) |
| `bg-header`          | translucent sidebar surface | translucent sidebar surface | Sticky app/marketing headers |
| `bg-track`           | `#f4f4f5` | `#27272a` | Muted fills / progress track       |
| `border-edge`        | `#e4e4e7` | `#27272a` | Hairline borders                   |
| `border-soft-border` | `#f0d4c7` | `#3a2519` | Primary-tinted borders (banners)   |
| `text-ink`           | `#18181b` | `#fafafa` | Primary text                       |
| `text-muted`         | `#71717a` | `#a1a1aa` | Secondary text                     |
| `text-subtle`        | `#a1a1aa` | `#71717a` | Tertiary / hints                   |
| `bg/text-primary`    | `#d9714e` | `#c97553` | Brand terracotta / actions         |
| `text-primary-dark`  | `#c25b3a` | `#b86544` | Pressed / over-budget              |
| `bg-primary-soft`    | `#fbeee8` | `#2a1a12` | Primary tint (active nav, banners) |
| `text-onprimary`     | `#ffffff` | `#fff7f2` | Text/icon **on** a primary fill    |
| `text-green`         | `#5f8a52` | `#7fae6a` | Income / positive                  |

Semantic pairing: **green = income/positive, primary = brand/actions,
primary-dark = over-budget/destructive text, onprimary = anything sitting on a
terracotta surface. Don't mix meanings.

Category accents (`clay`, `gold`, `peach`) remain as static fallback classes,
but a category's real color is per-row data passed via `style`.

## 2) Dark mode

- Class-based: `darkMode: "class"` in Tailwind; the `.dark` class lives on
  `<html>`. `color-scheme` is set per theme (`:root` light, `.dark` dark) so
  native controls (select popups, scrollbars) follow it too.
- The store holds `themePref` (`"system"` | `"light"` | `"dark"`) and the
  resolved `theme`; `setThemePref` (in
  [`../src/state/store.tsx`](../src/state/store.tsx)) persists the choice to
  `localStorage` under `sprout-theme` — **"system" is the default and removes the
  key**, so the app keeps following the device's `prefers-color-scheme` live
  (a `matchMedia` listener re-resolves on OS change while on "system").
- A tiny no-FOUC script in [`../src/app/layout.tsx`](../src/app/layout.tsx)
  applies `.dark` **before hydration** (stored `dark`, or no/`system` key +
  OS is dark), so there's no light-mode flash. `StoreProvider` reconciles on mount.
- The user picks **System / Light / Dark** from **Settings → Appearance** (web
  and mobile).

## 3) Typography

- **One typeface: Geist**, wired via `next/font` in `layout.tsx` as
  `--font-geist`. Both `font-display` and `font-sans` resolve to it.
- Weights are **restrained** (the biggest shift from the old playful look):
  titles `font-bold` (700), labels `font-semibold` (600) / `font-medium` (500).
  **Avoid `font-extrabold`.**
- Rough scale: page title (desktop) `text-[26px]`, mobile screen title
  `text-[20px]`, stat value `text-[26px]`, card title `text-[13.5px]`–`14px`,
  body `text-[13px]`, meta `text-[11px]`, uppercase labels `text-[10.5px]`.
  Numbers use `tabular-nums`.

## 4) Surfaces & shape

- **One canvas, elevated cards.** The app canvas (`bg-bg`) shares the warm tint
  of the nav rail and header (`bg-sidebar` / `bg-header`) so chrome and content
  read as a single surface with no seam. Content then sits on **elevated
  `bg-card` panels** (white in light, a step lighter than the canvas in dark)
  that lift off it. The app header is `absolute` over the scroll area so content
  scrolls behind its translucent `bg-header` (frosted glass), matching marketing.
- Cards combine a **hairline border with the elevated fill**:
  `rounded-[14px] border border-edge bg-card` (desktop) / `rounded-[10px] border
border-edge bg-card` (mobile). The border defines the edge; `bg-card` gives the
  lift against the tinted canvas. Radius tokens: `rounded-card` (14px),
  `rounded-tile` (12px), `rounded-pill` (10px), `rounded-window` (16px),
  `rounded-full` (pills). In the Transactions workspace only the table sits in a
  card (beside the category rail); the search bar and the type-filter pills sit
  bare on the canvas above it as individual elevated `bg-card` surfaces — a
  bordered search bar and bordered pills, not a shared container.
- **Nested tiles** inside a card (e.g. the Settings account/coming-soon tiles,
  the WhatsApp connected row) use a muted `bg-track` **inset** instead of
  `bg-card`, so a card-on-card reads as one recessed level down rather than two
  competing surfaces.
- The primary / "safe to spend" tile is filled `bg-primary text-onprimary`.
- Filter chips: `rounded-full`, active `bg-primary text-onprimary`, inactive
  `border border-edge text-muted`.
- Compound input containers use `focus-within:border-primary` with a one-pixel
  primary ring so keyboard and pointer focus produces a clear terracotta
  outline around the complete control.
- Inline category selects use the plain `border-edge` token in both themes;
  avoid opacity modifiers on CSS-variable colors because an invalid computed
  border can fall back to a harsh high-contrast native outline in dark mode.
- Segmented controls use `bg-primary text-onprimary` for the selected option and
  neutral muted text for inactive options, including nested report breakdowns.
- The compact `Excluded` transaction-status pill uses a transparent surface,
  `border-primary`, and `text-primary-dark` so the important budget exclusion is
  visible without reading like an active filter.

## 5) Icons

- Stroked [`lucide-react`](https://lucide.dev) icons for navigation and UI
  chrome — size 14–18, `strokeWidth={2}`. Sidebar/tab nav, search, chevrons,
  sort glyphs, empty-state tiles, etc.
- **Emoji** remain valid as **category icons** (categories carry an `emoji`
  field) and in category/goal/merchant rows.

## 6) Layout — two surfaces, one system

- **Desktop (`lg+`):** a persistent `bg-sidebar` left rail (lucide nav + user
  footer) beside a scrolling multi-column content area. Transaction creation
  lives in the Transactions page header rather than a duplicate rail action.
  Rendered by [`../src/components/web/WebApp.tsx`](../src/components/web/WebApp.tsx).
  The app shell owns a persistent page header (title + month pill/stepper) with
  the same fixed-shell behavior as the side rail; each view renders its **body
  only** in the independently scrolling content pane below it. Keep the shell
  constrained to the dynamic viewport so view content cannot create
  document-level overflow. Transactions keeps its controls and result summary
  visible while only the rows scroll; other desktop views scroll within the
  main content pane. The 64px app header shares the marketing header's
  `bg-header backdrop-blur` treatment and hairline bottom separator, while its
  translucent color is based on the sidebar surface in both themes. Each view
  supplies its own top spacing, so do not stack extra vertical header padding
  with a view margin.
  Every top-level desktop view fills the shell's content width; do not add
  per-view `max-w-*` caps. Readability limits belong on inner text blocks, not
  the tab layout itself.
- **Month controls:** every header month context renders through the shared
  [`MonthSelector`](../src/components/shared/MonthSelector.tsx) shell. The
  global `MonthStepper`, Cash flow's window-bound stepper, and read-only month
  context may own different behavior, but must not fork the visual treatment.
  Month selectors and their previous/next arrow controls use primary-colored
  outlines to make the active time context easy to locate without changing
  their neutral surface.
- **Mobile (`<lg`):** a centered `max-w-app` column with a sticky bottom bar — a
  full-width "Add transaction" button above a 5-icon lucide tab row (Home,
  Transactions, Categories, Goals, Bills). Touch targets ≥ 44px. Rendered by
  [`../src/components/mobile/MobileApp.tsx`](../src/components/mobile/MobileApp.tsx).
- **Auth screens:** login/signup render as a centered rounded card with a clear
  title, short supporting copy, form fields using 16px mobile-safe input text,
  icon-only password visibility toggles, and a single primary submit button. The
  onboarding budget step should persist the user's monthly budget, not just hold
  it locally. On mobile, wrap the flow in a safe-area-aware `100svh` shell and
  keep the card narrow enough to stay readable on iPhone-sized screens. Keep
  the shared auth layout simple and form-driven so Enter submits naturally.
- **Mobile header:** Home / Transactions / Categories / Bills use a sticky
  top shell header so the section title and primary action stay visible while the
  content scrolls; Transactions is the only place that surfaces the
  "Add transaction" CTA in the header. On headered primary screens, keep the
  content's own top padding restrained so the header provides most of the
  breathing room instead of stacking a second large gap underneath it.
- **Settings:** show the current monthly budget as an editable row in the
  account/preferences area so users can update it after signup on both mobile
  and web. On desktop, Preferences and Coming soon share one responsive
  two-column row beneath the account and connected-apps row: Coming soon stays
  in the left column under Profile, while Preferences occupies the right.
- **Empty states:** expose one primary CTA. For example, empty Goals uses the
  centered `Create a goal` action and hides the usual top-right `New goal`
  button until at least one goal exists.
- **Mobile add flow:** the transaction composer is a full-height screen with a
  pinned save bar, an amount-led header card, a small "Tap digits below to edit"
  hint, a horizontally scrollable category rail, and a calculator-like keypad.
  Keep the save action visible without scrolling and render it as a sticky,
  elevated primary button so it reads as the obvious commit action above the tab
  bar. Use one consistent vertical rhythm through the compact/mobile form stack;
  don't mix shell padding and per-field margins in a way that makes the first
  gap larger than the rest.
- **Mobile transaction selection:** keep bulk controls in a stacked panel rather
  than compressing them into one toolbar. The selection header, contextual
  income-source row, and destructive actions each get their own line; all taps
  remain at least 44px and list content clears the pinned bottom actions.
- **Desktop transaction selection:** use one compact, wrapping action bar. Keep
  each assignment select and its labelled Apply button together, then place
  exclusion, deletion, and clear controls alongside them. The category rail and
  transaction table must remain in a constrained shared grid row so selection
  actions cannot collapse the scrollable list or leave empty canvas below it.
- **Desktop CSV import:** keep the template download as a secondary button beside
  the primary Browse CSV files action. How it works and Smart import belong in
  the upper guidance sidebar aligned with the upload card, not below the main
  workflow or stretched into full-height grid cells.

## 7) Empty states

Centered: a `w-14 h-14 rounded-[16px] bg-track` tile holding a lucide icon
(`text-muted`), a `text-[15px] font-semibold` title, a `text-[12px] text-muted`
subtext, and a `bg-primary text-onprimary rounded-[10px]` action button.

## 8) Money

Money is always integer **cents** end-to-end. Only `formatMoney()` in
[`../src/lib/format.ts`](../src/lib/format.ts) converts to display strings. Never
do `amount / 100` in a component.
