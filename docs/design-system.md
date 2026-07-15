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

| Token (class)        | Light      | Dark       | Use |
| -------------------- | ---------- | ---------- | --- |
| `bg-bg`              | `#ffffff`  | `#09090b`  | App canvas |
| `bg-card`            | `#ffffff`  | `#141416`  | Card surface |
| `bg-sidebar`         | `#faf8f5`  | `#0f0f11`  | Left nav rail (desktop) |
| `bg-track`           | `#f4f4f5`  | `#27272a`  | Muted fills / progress track |
| `border-edge`        | `#e4e4e7`  | `#27272a`  | Hairline borders |
| `border-soft-border` | `#f0d4c7`  | `#3a2519`  | Primary-tinted borders (banners) |
| `text-ink`           | `#18181b`  | `#fafafa`  | Primary text |
| `text-muted`         | `#71717a`  | `#a1a1aa`  | Secondary text |
| `text-subtle`        | `#a1a1aa`  | `#71717a`  | Tertiary / hints |
| `bg/text-primary`    | `#d9714e`  | `#c97553`  | Brand terracotta / actions |
| `text-primary-dark`  | `#c25b3a`  | `#b86544`  | Pressed / over-budget |
| `bg-primary-soft`    | `#fbeee8`  | `#2a1a12`  | Primary tint (active nav, banners) |
| `text-onprimary`     | `#ffffff`  | `#fff7f2`  | Text/icon **on** a primary fill |
| `text-green`         | `#5f8a52`  | `#7fae6a`  | Income / positive |

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

- Cards are delineated by a **hairline border**, not a fill:
  `rounded-[14px] border border-edge` (desktop) / `rounded-[10px] border
  border-edge` (mobile). Radius tokens: `rounded-card` (14px), `rounded-tile`
  (12px), `rounded-pill` (10px), `rounded-window` (16px), `rounded-full` (pills).
- The primary / "safe to spend" tile is filled `bg-primary text-onprimary`.
- Filter chips: `rounded-full`, active `bg-primary text-onprimary`, inactive
  `border border-edge text-muted`.

## 5) Icons

- Stroked [`lucide-react`](https://lucide.dev) icons for navigation and UI
  chrome — size 14–18, `strokeWidth={2}`. Sidebar/tab nav, search, chevrons,
  sort glyphs, empty-state tiles, etc.
- **Emoji** remain valid as **category icons** (categories carry an `emoji`
  field) and in category/goal/merchant rows.

## 6) Layout — two surfaces, one system

- **Desktop (`lg+`):** a persistent `bg-sidebar` left rail (lucide nav + "Add
  transaction" + user footer) beside a scrolling multi-column content area.
  Rendered by [`../src/components/web/WebApp.tsx`](../src/components/web/WebApp.tsx).
  The app shell owns the page header (title + month pill/stepper); each view
  renders its **body only**.
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
  "Add transaction" CTA in the header.
- **Settings:** show the current monthly budget as an editable row in the
  account/preferences area so users can update it after signup on both mobile
  and web.
- **Mobile add flow:** the transaction composer is a full-height screen with a
  pinned save bar, an amount-led header card, a small "Tap digits below to edit"
  hint, a horizontally scrollable category rail, and a calculator-like keypad.
  Keep the save action visible without scrolling and render it as a sticky,
  elevated primary button so it reads as the obvious commit action above the tab
  bar. Use one consistent vertical rhythm through the compact/mobile form stack;
  don't mix shell padding and per-field margins in a way that makes the first
  gap larger than the rest.

## 7) Empty states

Centered: a `w-14 h-14 rounded-[16px] bg-track` tile holding a lucide icon
(`text-muted`), a `text-[15px] font-semibold` title, a `text-[12px] text-muted`
subtext, and a `bg-primary text-onprimary rounded-[10px]` action button.

## 8) Money

Money is always integer **cents** end-to-end. Only `formatMoney()` in
[`../src/lib/format.ts`](../src/lib/format.ts) converts to display strings. Never
do `amount / 100` in a component.
