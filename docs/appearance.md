# Appearance

Settings offers two independent controls on mobile and desktop:

- **Visual theme:** Vibrant (the existing Sprout design) or Cozy (cream
  surfaces, a peach sidebar, sage accents, and stroked category symbols).
- **Appearance:** System, Light, or Dark. System follows device changes live.

Cozy takes visual inspiration from the homebudget reference repository but uses
Sprout's existing layouts, Geist typography, CSS variables, Tailwind classes,
and Lucide library. Both palettes support light and dark mode. Vibrant remains
the initial choice for existing and new visitors.

## Preference lifecycle

`src/lib/appearance/index.ts` owns preference parsing, persistence, DOM updates,
and the pre-paint script used by both root layouts. The Zustand store holds
`visualTheme` independently from `themePref` and resolved `theme`.

The palette is stored in `localStorage` as `sprout-visual-theme=cozy`; choosing
Vibrant removes the key. Existing `sprout-theme` light/dark storage is unchanged.
The root `data-visual-theme` attribute selects CSS tokens, while `.dark` selects
color mode. Unknown palette values fall back to Vibrant. Storage failures allow
session-only changes; the bootstrap still resolves system mode when storage is
blocked. Preferences apply to this browser, across personal and future group
spaces; they do not change other members' settings or persist to the server.

## Symbols and tokens

`EntitySymbol` renders stored emoji identities unchanged in Vibrant. Cozy maps
recognized identities to Lucide icons, including category picker previews,
budget rows, transaction cards, recurring items, goals, and income/business
labels. Unsupported custom emoji remain visible. Native HTML select options
continue using text/emoji because they cannot render SVG icons.

The mapping is presentation-only: choosing a palette never rewrites categories,
amounts, IDs, or imported records. Category accent colors remain user data and
may tint Cozy's circular icon surfaces. Decorative symbols are hidden from
assistive technology; surrounding labels and picker button names provide the
accessible identity.

Cozy's pale primary fill uses dark `text-onprimary`. The semantic `text-primary`
and `border-primary` classes have separate ink/outline variables so links and
control boundaries remain readable on cream surfaces. Components must continue
using semantic classes rather than branching on the selected palette.
