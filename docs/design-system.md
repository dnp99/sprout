# Sprout — Design System

The **Sprout** design language: friendly, playful, warm.
Tokens are defined in [`../tailwind.config.ts`](../tailwind.config.ts) and must
be used via their semantic Tailwind classes — never hard-code hex values in
components (the sole exception is a category's own dynamic accent color, passed
through `style`).

## 1) Color tokens

| Token | Hex | Tailwind class | Use |
| --- | --- | --- | --- |
| `bg` | `#fbf3e9` | `bg-bg` | App canvas (warm cream) |
| `card` | `#ffffff` | `bg-card` | Card surface |
| `surface` | `#4a3b2e` | `bg-surface` | Dark hero (budget total) |
| `track` | `#f0e5d6` | `bg-track` | Progress-bar track |
| `ink` | `#4a3b2e` | `text-ink` | Primary text |
| `muted` | `#a08d78` | `text-muted` | Secondary text |
| `subtle` | `#c9b49b` | `text-subtle` | Tertiary / hints |
| `primary` | `#d97a54` | `bg-primary` / `text-primary` | Brand terracotta |
| `primary-dark` | `#c25b3a` | `text-primary-dark` | Over-budget / pressed |
| `green` | `#7e9b6b` | `text-green` | Income, positive |
| `gold` | `#e7a34a` | — | Category accent |
| `clay` | `#c98a5a` | — | Category accent |
| `peach` | `#f2c8a8` | `bg-peach` | Avatar / soft fills |
| `edge` | `#e3ccae` | `border-edge` | Dashed "new" borders |

Semantic pairing: **green = income/success, primary = brand/actions,
primary-dark = over-budget/destructive text.** Don't mix meanings.

## 2) Typography

- **Display / UI:** Bricolage Grotesque — `font-display`. Headings and most UI
  text. Weights lean heavy: `font-bold` (700) / `font-extrabold` (800).
- **Body:** Figtree — `font-sans`.
- Both are self-hosted via `next/font` in `src/app/layout.tsx` and exposed as
  the CSS vars `--font-bricolage` / `--font-figtree`.

Rough scale used on Home: hero number `text-[42px]`, section titles `text-base`,
card labels `text-[12.5px]`, meta `text-[11px]`. Numbers use `tabular-nums`.

## 3) Radii & spacing

- Radii: `rounded-card` (24px) for hero/section cards, `rounded-pill` (16px) for
  list rows and inputs, full-round for avatars and the FAB.
- Screen padding: `px-[22px]`. Vertical rhythm in ~4px steps.

## 4) Components

- **ProgressBar** (`src/components/ui/ProgressBar.tsx`) — cream `bg-track` +
  accent fill, animated width. Category rows pass their own `color`.
- **Cards** — `bg-card rounded-card p-5`. Tappable cards are `<button>`s.
- **Category row** — emoji + name + amount + thin progress bar.
- **Transaction card** — emoji + merchant + `category · date` + signed amount
  (income in `text-green`).
- **TabBar** — sticky bottom, 5 slots (Home · Categories · ＋ · Goals · Bills);
  center ＋ is a raised FAB in `bg-primary` that opens the add-expense sheet.
- **AddExpenseSheet** — bottom sheet; amount + merchant + category chips → writes
  to the local store.

## 5) Layout & responsive surfaces

Mobile-first, but the app ships two surfaces off one store:

- **Below `lg`** — the **mobile app**: a centered `max-w-app` (480px) column
  (`components/mobile/MobileApp`) with a sticky bottom tab bar. Content scrolls;
  minimum touch target 44px.
- **At `lg+`** — the **web companion** (`components/web/WebApp`): a sidebar +
  main dashboard.

`AppShell` gates both behind the auth/onboarding flow (`components/auth`), then
switches surface via Tailwind responsive classes (`lg:hidden` / `hidden
lg:block`) — no hydration branch. Shared UI primitives in `components/ui` (and
`components/shared/AddForm`) are reused by both surfaces so they stay in sync.

## 6) Money display

All amounts are integer **cents** in code. `formatMoney(cents, opts)` in
`src/lib/format.ts` is the only place cents become strings:

- `formatMoney(248000)` → `"$2,480"` (whole dollars drop the cents)
- `formatMoney(-6420, { signed: true })` → `"−$64.20"`
- `formatMoney(320000, { signed: true })` → `"+$3,200"`

Uses the Unicode minus `−` to match the prototype.

## 7) Adding a screen / category

- New screens: add a `TabKey`/`ScreenTab` (or an in-screen route), build under
  `src/components/<screen>/`, read from `useStore()`, and keep to these tokens.
- New categories carry `{ emoji, color, monthlyBudgetCents }`; the `color` is the
  progress accent.
