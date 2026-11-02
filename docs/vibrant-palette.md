# Vibrant — Muted Indigo

Vibrant uses Muted Indigo `#6670B8` for primary fills, branding and selection,
Soft Indigo `#EEF0FA` for light supporting surfaces, and Deep Muted Indigo
`#5561A8` for prominent actions. All palette tokens live in
`src/app/vibrant-theme.css`, scoped to the root selector excluding both Cozy and Elegant.
This replaces the old Sky Blue ledger overrides in globals.css. Theme
selection/storage, layouts, typography, spacing and responsive behavior are
unchanged. Cozy and Elegant declarations are untouched.

The neutral warm canvas and white cards remain neutral. Dark mode uses neutral
charcoal surfaces, an indigo-tinted secondary `#282B42`, and a pale indigo link
ink `#B9C1F0`. Both ledgers, navigation rails and portaled controls inherit the
same palette. Status colors and custom category accents remain semantic data;
default chart series use related muted indigo tones.

## Roles and states

- `--primary`: `#6670B8`; `--primary-soft`: Soft Indigo (dark companion above).
- `--primary-ink`: `#5561A8` in light mode and `#B9C1F0` in dark. This contrast
  variant keeps small links/icons readable on canvas and secondary surfaces.
- `--cta`, `--cta-hover`, `--cta-active`: `#5561A8`, `#485393`, `#3E487F`.
  `--oncta` is white in both modes. Tailwind exposes `bg-cta`, `bg-cta-hover`
  and `text-oncta`, with existing primary-role fallbacks for other themes.
- Existing filled primary action buttons use CTA through a scoped compatibility
  selector; pressed/current/tab/switch selection controls keep the primary role.
  Calendar record actions and floating record actions use the same CTA role.
- Supporting selections and hover states use Soft Indigo/tinted rail tokens;
  focus outlines use primary in light mode and pale indigo in dark mode.
  Disabled controls retain their existing opacity/interaction behavior.

## Contrast

White on Primary is 4.59:1; white on CTA is 5.74:1. Primary itself is only
4.04:1 against Soft Indigo and 4.33:1 against the warm canvas, so small accent
text uses the deeper ink variant instead. CTA/link ink against Soft Indigo is
over 4.5:1. Neutral ink and muted text also target AA on their paired surfaces.
Dark focus/link colors are lightened for readability; action labels remain
white on the unchanged deep CTA. Palette contrast tests read the actual CSS
tokens and check text/fill pairs in both modes. Disabled/inactive states are
not treated as normal text contrast targets. No gradient or dependency is added.

## Dark desktop rail

Vibrant's desktop sidebar uses deep indigo `#373F70` in light mode and
`#20243D` in dark mode, with pale labels and subtly lighter active/hover fills.
Page/card surfaces remain unchanged. Rail-local ink is restored to page ink
inside card controls (context switch, collapse control and Account menu), so
light panels do not inherit pale navigation text. Personal and Group share this
rail treatment; Cozy, Elegant and mobile navigation colors remain unchanged.
The desktop Personal/Groups switch uses a subdued indigo rail track instead of
a white card, retaining the primary selected pill and pale inactive icon. Account
menus and other card controls continue to restore page colors.
