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

| Token (class)        | Light                       | Dark                        | Use                                |
| -------------------- | --------------------------- | --------------------------- | ---------------------------------- |
| `bg-bg`              | `#faf8f5`                   | `#0f0f11`                   | App canvas (= nav rail + header)   |
| `bg-card`            | `#ffffff`                   | `#141416`                   | Elevated card surface              |
| `bg-sidebar`         | `#a4bdad` Personal / `#d3ab7f` Group | `#0e1612` Personal / `#17130f` Group | Deeper context-tinted navigation rail |
| `bg-header`          | translucent sidebar surface | translucent sidebar surface | Sticky app/marketing headers       |
| `bg-track`           | `#f4f4f5`                   | `#27272a`                   | Muted fills / progress track       |
| `border-edge`        | `#e4e4e7`                   | `#27272a`                   | Hairline borders                   |
| `border-soft-border` | `#f0d4c7`                   | `#3a2519`                   | Primary-tinted borders (banners)   |
| `text-ink`           | `#18181b`                   | `#fafafa`                   | Primary text                       |
| `text-muted`         | `#71717a`                   | `#a1a1aa`                   | Secondary text                     |
| `text-subtle`        | `#a1a1aa`                   | `#71717a`                   | Tertiary / hints                   |
| `bg/text-primary`    | `#d9714e`                   | `#c97553`                   | Brand terracotta / actions         |
| `text-primary-dark`  | `#c25b3a`                   | `#b86544`                   | Pressed / over-budget              |
| `bg-primary-soft`    | `#fbeee8`                   | `#2a1a12`                   | Primary tint (active nav, banners) |
| `text-onprimary`     | `#ffffff`                   | `#fff7f2`                   | Text/icon **on** a primary fill    |
| `text-green`         | `#5f8a52`                   | `#7fae6a`                   | Income / positive                  |
| `text/bg-warning`    | semantic                    | semantic                    | Approaching a budget limit         |
| `text/bg-danger`     | semantic                    | semantic                    | Over budget / destructive status   |

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

### Visual themes

Settings also offers **Vibrant / Cozy**, independently of System / Light / Dark.
Vibrant preserves the palette above; Cozy overrides the same semantic variables
with cream surfaces, sage navigation, and soft green accents. `text-primary` uses
`--primary-ink` and `border-primary` uses `--primary-outline`; both match primary
in Vibrant and provide darker contrast for Cozy's light sage fill. Entity symbols
use a shared presentation component, retaining emoji data while rendering Lucide
icons in Cozy. See [appearance.md](appearance.md) for persistence and fallbacks.

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
  of the header (`bg-header`). The nav rail (`bg-sidebar`) has a separate
  context tint: green for Personal and orange for Group. Content then sits on **elevated
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
- **Modal backdrops are shared.** Use the global `modal-backdrop` class for
  every modal or confirmation overlay. It derives its color from `--bg` and
  takes opacity and blur from `--modal-backdrop-opacity` and
  `--modal-backdrop-blur`, keeping desktop and mobile dialogs equally legible
  in both themes. Do not introduce per-dialog backdrop opacity or blur values.

## 5) Icons

- Stroked [`lucide-react`](https://lucide.dev) icons for navigation and UI
  chrome — size 14–18, `strokeWidth={2}`. Sidebar/tab nav, search, chevrons,
  sort glyphs, empty-state tiles, etc.
- Stored `emoji` values identify category/goal/merchant icons; render them through
  `EntitySymbol` as monochrome Lucide SVGs in every palette.

## 6) Layout — two surfaces, one system

- **Desktop (`lg+`):** a persistent `bg-sidebar` left rail (lucide nav + user
  footer) beside a scrolling multi-column content area. It can collapse to an
  icon rail with a header control; each icon retains an accessible name and
  hover title, and the user can expand it again. The setting is stored locally
  (`sprout-sidebar-collapsed`) rather than in account data. Transaction creation
  is available in every desktop page header before the time control, through
  the shared QuickAddButton; mobile primary headers use its compact form.
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
  The month selector uses a primary-colored outline, while its previous/next
  arrow buttons remain borderless with primary-colored icons. This keeps the
  active time context easy to locate without adding visual weight to each arrow.
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
  content scrolls; Primary screens share a compact
  "Add transaction" action in the header. On headered primary screens, keep the
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
  expense-category and income-source rows, and destructive actions each get
  their own line; all taps remain at least 44px and list content clears the
  pinned bottom actions.
- **Desktop transaction selection:** use one compact, wrapping action bar.
  Category and income-source menus apply their selected value immediately, then
  place exclusion, deletion, and clear controls alongside them. The category
  rail and transaction table must remain in a constrained shared grid row so
  selection actions cannot collapse the scrollable list or leave empty canvas
  below it. Keep the bar sticky while table rows scroll. Its count uses full
  singular/plural wording; only expense-only selections offer category changes,
  only income-only selections offer source changes, and mixed selections offer
  neither. Clear selection stays right-aligned with an X icon, accessible name,
  and tooltip. Successful assignment toasts include Undo; failures retain the
  selection and surface an error toast.
- **Action feedback:** updates and deletions display one shared, dismissible
  toast only after the API request succeeds; failures use the same toast surface
  with an error icon. The toast is fixed above both mobile and desktop chrome,
  uses `bg-card` + `border-edge`, and auto-dismisses after 4.5 seconds. Reuse
  [`ToastProvider`](../src/components/ui/Toast.tsx) rather than adding local
  success banners for an action that should be acknowledged transiently.
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

## Group context

Personal / Groups navigation shares one ContextSwitch. The responsive group
shell has a desktop sidebar and mobile bottom tabs, using the same header,
MonthSelector, EntitySymbol, modal scrim and semantic tokens as personal views.
Vibrant/Cozy and light/dark apply automatically. Group fields and actions retain
44px touch targets. Group screens never introduce theme-specific component
branches or a separate font system. See [groups.md](groups.md).

## Cozy surface composition

Cozy follows Together's warm, playful palette: cream canvas, sage navigation,
and sage, mint, butter-yellow and peach section fills. Cards and separators use
transparent edge/soft-border tokens: sections are distinguished by color and
spacing, without visible hairlines. Primary focus outlines remain visible.
Desktop Overview assigns semantic surface roles to the budget hero, recent
transactions, frequent merchants and category panel. These roles resolve to
neutral cards in Vibrant and muted matching hues in dark Cozy; components do
not branch by theme. Geist, Sprout's responsive grid and restrained card shapes
remain shared. Mobile composition will be reviewed after the desktop design.

### Personal and Group color identity

Together is the color reference for Cozy: Personal navigation uses sage
`#a4b88d`; Group uses peach `#e8b48c`. GroupApp declares its ledger context on
its shell, which scopes the sidebar token without changing stored preferences
or leaking colors into Personal. Both contexts share Together's sage spending
(`#d4e2bf`), mint income (`#dce8d7`), butter (`#f1e5b0`) and peach surfaces.
Group summary tiles use these same surface roles. Dark mode preserves the
sage/personal and warm peach/group distinction with darker companion colors;
these are Sprout adaptations because the inspected Together reference is light.

### Vibrant context navigation

Vibrant keeps its neutral panels, hairline borders and terracotta actions while
using restrained ledger colors: Personal has a eucalyptus rail (`#e8efeb`),
Group a warm orange rail (`#f2e6dc`). Dark companions are `#19241f` and `#30231c`.
Both visual themes define `--sidebar` (Personal) and `--sidebar-group` (Group);
the group shell overrides only `--sidebar` using the shared context selector.
Switching contexts never changes the saved visual theme. Header and canvas
remain neutral in Vibrant. Cozy retains the brighter Together palette.

### Coordinated Vibrant rail ink

Vibrant navigation uses a complete context palette, rather than retaining
terracotta text on the green rail. Personal uses deep green logo, active labels
and icons, green-tinted secondary ink, and a sage selected fill. Group uses
warm brown/orange ink with sand selected fills. Each has light/dark companions.
The rail locally maps existing semantic ink, primary, soft-fill and hover tokens
to `--rail-*` variables. These overrides stay inside `.bg-sidebar`, leaving
content actions unchanged. Cozy continues using its Together reference palette.

### Approved Cozy dark: Warm Apricot / Stone

The user selected the first warm-dark proposal (暖杏石灰). Cozy dark now uses
mid-dark stone/green canvas `#2b3231`, neutral panels `#39433f`, mint spending
and income surfaces, and soft off-white text. Personal navigation is mint-green
`#3b594c`; Group navigation is warm stone `#474640`, with pale apricot brand
ink `#efcc97`, soft-white selected labels, and a muted golden selected fill
`#70634c`.
The rail scopes its own ink, hover and selection tokens, while content actions
stay mint. Warm secondary panels are neutral stone rather than reddish brown;
no black canvas, visible card borders, or pure-white text is introduced.
Light Cozy and both Vibrant modes retain their palettes. Cozy cards use the user-selected maximum preview radius of 24px in both color
modes; Vibrant retains its existing shapes.

Cozy card radius is controlled by `--card-radius` (24px); `rounded-card` and
legacy 14px cards / 16px hero surfaces share it. Inputs, buttons and navigation
retain their compact shapes. Vibrant defaults to a 14px semantic card radius.

## Ledger-dependent 65:35 color balance

Both themes now use green-dominant Personal content and orange-dominant Group
content. Major/minor surface roles and desktop overview grids enforce 65:35
colored-panel area. This supersedes the earlier neutral-only Vibrant overview
and fixed category/merchant panel mappings. Neutral form/table surfaces and
semantic financial colors retain their roles. See [context-color-balance.md](context-color-balance.md).

Cozy refinement: prefer interleaved sage/mint/blue-green, yellow and peach/rose
panels with varied row widths, following the Together screenshot. The 65:35
rule is a broad family balance for Cozy, not rigid columns or exact panel area.
Vibrant retains its stricter composition. See [context-color-balance.md](context-color-balance.md).

Cozy canvas refinement: light uses warm cream `#fbf7ef` with a matching
translucent header; dark uses warm neutral `#33312d` instead of green-grey.
Light apricot, mint, blue-green and yellow panels use cleaner pastel chroma,
closer to Together's reference, while sage navigation/hero remain anchored to
its green palette. Rose panels lean peach rather than pink. The warm canvas
and clear low-saturation fills replace the preceding grey-green impression;
Vibrant is unchanged.

## Vibrant harmonious context families

Vibrant Personal now uses green + blue throughout the authenticated desktop
shell: green brand/actions and main panels, blue companion panels, cool neutral
canvas and white data surfaces. Group uses orange + yellow: warm orange
brand/actions and main panels, yellow companion panels, warm neutral canvas.
Each has matching dark companions with readable light accents and darker
button ink. This supersedes the earlier green/orange contrast inside each
Vibrant context and the global terracotta action color within these shells.
The 65:35 major/companion layout, restrained radii and hairlines remain.

The selectors are scoped to `data-ledger-context` and exclude Cozy, so switching
contexts restores the corresponding palette without changing preferences.
Financial income/warning/error colors and user-defined category colors remain
semantic; marketing/auth surfaces and Cozy are unaffected. The desktop-first
scope is preserved; phone composition remains a separate pass.

Vibrant light uses the selected second hierarchy preview with reduced card
brightness: navigation deepest, canvas intermediate, tinted panels lightest.
See [appearance.md](appearance.md#selected-vibrant-surface-hierarchy) for values.

## Monochrome icon rendering

All palettes and responsive layouts use monochrome Lucide icons. Stored `emoji`
fields remain unchanged for compatibility, but `EntitySymbol` resolves them to
SVG with a Tag fallback, never platform emoji. Native selects show text names;
translated UI copy contains no decorative emoji. See [appearance.md](appearance.md).

## Shared menus and ledger calendar

All value selectors use `Select`: Cozy presents Together-style circular icon
choices in a named grid; Vibrant presents compact bordered rows. Action menus
share the palette but retain action rows. Overview includes the shared everyday
calendar in both ledger contexts and responsive layouts. See
[menus-and-calendar.md](menus-and-calendar.md) for keyboard behavior, complete
calendar data, accounting, and theme treatments. Together remains read-only.

## Feature workspace refinement

Cozy feature panels now share Overview's interleaved surface roles. Icons across
the app are unframed monochrome strokes matching adjacent text; this supersedes
circular decorative icon holders, including selector symbol holders. Real
control selection/focus backgrounds remain. Charts use legible opaque color on
quieter card backgrounds. See [cozy-workspaces.md](cozy-workspaces.md).

## Shared structure across visual themes

Cozy and Vibrant use the same calendar-first Home order, linked statistics and
payer/category filters, reporting-date picker, compact vertical menus and
single/multiple-group navigation. Layout/interaction changes do not branch by
visual theme. This supersedes the earlier Cozy-only calendar order.

Vibrant keeps its semantic neutral cards, hairline borders, restrained 14px card
radius and context accent colors. Cozy alone applies larger soft cards and
mint/peach tinted controls. The date picker and menus consume existing theme
tokens rather than adding pastel styling to Vibrant. Palette switching preserves
report filter state.

### Supporting progress colors

Progress fills mix their category/status token with the card surface (Cozy 66%, Vibrant 76% color). The normal/near-limit/over-limit thresholds and textual amounts remain unchanged. This reduces the visual contrast of long budget bars while keeping recognizable green, amber and terracotta hues. Goal fills retain their existing comfortable category colors. Plot palettes are independent: do not fade entire charts or reduce data opacity to style a progress indicator. Shared `ProgressBar` and proportional bars in Trends/Cash flow use this finish on mobile and desktop.

The budget summary's **Spent this month** fill uses the positive green token rather than the pale primary button token. This preserves a visible green fill on the Cozy yellow summary card; overspend remains explicit in the amount and “over” text. Desktop and mobile share the same choice.


### Group category accent controls

Group category icons retain their unframed monochrome Lucide shape but use the
category's saved accent as stroke color. This user-controlled group exception
supersedes inherited text ink for those symbols. The editor previews its current
draft accent and uses a borderless round icon trigger plus a circular color
swatch, each with a 44px target and visible keyboard focus. Personal icons retain
their inherited-ink treatment.

Group Transactions uses a wrapping sticky selection bar with an explicit count
and clear action. Bulk editors reuse the shared modal, semantic tokens and 44px
targets. On phones, actions wrap into multiple lines rather than compressing
select, copy, date/category controls and deletion into one narrow toolbar.

### Group category organization

The category organizer uses explicit root, subcategory and merge destination
boxes. Selected handles and hovered drop targets use primary-soft tokens; a
pointer-events-none drag label follows the pointer. The same destinations are
keyboard/tap buttons with 44px targets. A sticky action row offers undo and
Save/review, then a distinct final confirmation. Draft/review states share the
existing accessible group dialog rather than nesting focus traps.
