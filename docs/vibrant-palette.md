# Vibrant — Ink Navy

Vibrant keeps Ink Navy branding and restrained steel-blue actions. Its tokens
and selectors live in `src/app/vibrant-theme.css`, explicitly excluding Cozy
and Elegant. Root tokens reach portaled menus, dialogs, forms and tooltips;
ledger-scoped roles cover Personal and Groups on desktop and mobile. Appearance
storage, system mode, layouts, typography, radii and financial colours are unchanged.

## Palette

| Role | Light | Dark |
| --- | --- | --- |
| Sidebar | `#1F2A44` | `#151D2B` |
| Canvas | `#F8F9FB` | `#111722` |
| Card | `#FFFFFF` | `#1D2634` |
| Secondary | `#EDF1F5` | `#293445` |
| CTA | `#3E5F8A` | `#7399C5` |
| CTA text | `#FFFFFF` | `#111722` |
| Border | `#E3E7ED` | `#344153` |
| Primary text | `#252B36` | `#F1F4F8` |
| Muted text | `#667085` | `#A9B5C5` |
| Selection fill | `#DFE6EF` | `#35455B` |
| Row hover | `#F3F5F8` | `#242F3E` |

CTA hover/pressed colours remain `#345276` / `#2B4565` in light mode and
`#86A9D1` / `#668BB6` in dark mode. Floating Add Record and calendar record
actions share these roles. Existing disabled opacity remains; focus uses a
contrasting theme outline. No gradients or decorative shadows are added.

## Surfaces and states

Large dashboard and budget surfaces resolve to neutral cards. The calendar
panel and ordinary dates stay neutral; selected dates retain a soft fill and
an ink/steel boundary. Supporting control tracks and table header/totals use
secondary surfaces, separating content layers without filling whole sections blue.

All record lists use neutral ordinary rows and hairline separators,
including virtualized desktop tables and Overview previews. Explicit scoped
row rules take precedence over legacy zebra selectors. Tables and connected
lists retain their existing borders; other lists use inset separators without
changing row dimensions. Hover uses the quieter
row-hover token. Selected records use selection fill plus an ink leading edge;
recently edited records use a 16% CTA/card mix and CTA leading edge. Hover
never overrides either state. Checkboxes, financial status tags, income/expense
colours and user-defined category accents retain their original semantics.

Selected filters, segmented controls, context switches and mobile navigation use
solid semantic primary fills with contrasting `--oncta` text/icons in both modes.
Record and calendar-cell selections retain neutral selection fills.
Inactive controls remain quiet. Desktop navigation keeps the dark rail with
pale labels and subtle lighter navy hover/active fills; its context switch
inherits rail ink and selection colours. Mobile uses page ink. Portaled menus
inherit root card and ink tokens, avoiding rail-only text colours.

## Contrast and validation

The shared floating Add record action uses primary fill and contrasting on-CTA
ink in both ledgers and modes. Hover/pressed fills derive from primary rather
than the separate blue CTA palette, matching selected navigation at rest.

CSS-token tests cover normal text, CTA default/hover/pressed labels, rail labels,
selection text and selected-control boundaries in both modes. Muted secondary
surfaces use `--secondary-muted` (`#596476` light / `#B6C3D1` dark) rather than
assuming the canvas muted colour passes on every control fill. Selected rows
also use this stronger secondary ink. Disabled controls are exempt from normal
text contrast targets. Thin decorative card separators are not control outlines.

Cozy/Elegant stylesheets and appearance persistence remain unchanged. Run lint,
unit tests and production build; browser/device checks should cover both ledgers,
all workspaces, portals, hover/focus/selection and light/dark/system switching.

## Verification record

Checked the rendered local demo at 1280px desktop and 393px mobile widths:
Overview/Home, Transactions, Budget & Goals, Trends and Settings in both ledgers
and both modes. Computed canvas/card tokens match the palette, ordinary visible
record rows use one card colour, and no document-level horizontal overflow was
observed. Group selection uses the separate neutral selection fill. Mobile Group
editing retains `overflow-y: auto` with `scrollbar-width: none`. Checked the
portaled appearance dialog, transaction action menu and editor. Native device/PWA
keyboard rendering and exhaustive hover/disabled combinations remain manual QA.

The final contrast check also covers supporting ink on selection fills, avoiding
a light-mode muted-label contrast regression. Production build/type checking,
lint and unit tests validate integration; theme persistence tests are unchanged.
