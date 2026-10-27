# Appearance

Settings offers two independent controls on mobile and desktop:

- **Visual theme:** Vibrant (the existing Sprout design) or Cozy (cream
  surfaces, a sage sidebar, sage accents, and stroked category symbols).
- **Appearance:** System, Light, or Dark. System follows device changes live.

Cozy takes visual inspiration from Together (cream canvas, sage navigation and
soft green actions) and the homebudget reference repository, and uses
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

`EntitySymbol` renders every stored emoji identity as a monochrome Lucide icon
in both Vibrant and Cozy, including category picker previews, budget rows,
transaction cards, recurring items, goals, and income/business labels. Unknown
custom identities fall back to Tag; flower and shield goals have explicit
mappings. SVG strokes inherit the surrounding semantic text color. Native HTML
select options use readable names only because they cannot reliably render SVG.
Transaction filters share `TransactionTypeIcon`; message catalogs contain text
rather than decorative emoji. Marketing, loading, empty and setup surfaces also
use the shared symbol renderer.

The mapping is presentation-only: choosing a palette never rewrites categories,
amounts, IDs, or imported records. Category accent colors remain user data and
may tint Cozy's circular icon surfaces. Decorative symbols are hidden from
assistive technology; surrounding labels and picker button names provide the
accessible identity.

Cozy's pale primary fill uses dark `text-onprimary`. The semantic `text-primary`
and `border-primary` classes have separate ink/outline variables so links and
control boundaries remain readable on cream surfaces. Components must continue
using semantic classes rather than branching on the selected palette.

## Together fusion — local first pass

The first UI increment aligns Cozy navigation with the Together reference: a
sage desktop rail, cream canvas, and pill-shaped Personal / Groups switch on
both contexts. The desktop Sprout wordmark uses a stroked Lucide sprout symbol
to match navigation chrome. Sprout retains its Geist typography, hairline card
borders and compact responsive layouts. Dark Cozy uses a sage rail through
the same semantic tokens. The everyday ledger calendar is now implemented in
Sprout; report and investment migrations remain separate work. See
[menus-and-calendar.md](menus-and-calendar.md).

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

Sidebar secondary text uses `--sidebar-muted`, scoped to the navigation surface,
to maintain contrast on tinted rails without darkening content-panel metadata.

### Coordinated Vibrant rail ink

Vibrant navigation uses a complete context palette, rather than retaining
terracotta text on the green rail. Personal uses deep green logo, active labels
and icons, green-tinted secondary ink, and a sage selected fill. Group uses
warm brown/orange ink with sand selected fills. Each has light/dark companions.
The rail locally maps existing semantic ink, primary, soft-fill and hover tokens
to `--rail-*` variables. These overrides stay inside `.bg-sidebar`, leaving
content actions unchanged. Cozy continues using its Together reference palette.

Personal context uses the Lucide `UserRound` symbol in both visual themes;
the person icon identifies a personal ledger without implying locked access.

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

The shared [ledger color-balance rule](context-color-balance.md) now applies to
both palettes: Personal's colored overview panels are 65% green / 35% orange;
Group reverses that balance. Themes supply their own light/dark family tints.

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

Vibrant navigation is one shade deeper than the content surfaces: light
Personal `#c4d5ca`, light Group `#e1c2a1`; dark Personal `#0e1612`, dark Group
`#17130f`. This replaces the earlier pale rail values while preserving the
coordinated logo/text and selected fills. Cozy is unchanged.

Vibrant light sidebar secondary ink is deepened alongside the rail (`#44574c`
Personal / `#644b38` Group) to retain readable contrast on the richer tint.

## Selected Vibrant surface hierarchy

The user chose 清晰层次 (the second preview), then requested softer card
brightness. Light Personal uses navigation `#a4bdad`, canvas `#dfe8e2`, and
light green `#edf3ef` / blue `#edf2f8` content panels. Light Group uses navigation
`#d3ab7f`, canvas `#eddfcc`, and soft apricot `#faf3e8` / yellow `#f8f2df` panels.
These panels reduce the near-white preview brightness while remaining lighter
than the canvas; the sidebar is the deepest surface. Shared neutral cards use
the corresponding softened fill too. Header tint follows the canvas, and
selected navigation keeps a separate fill. This is a light-mode refinement;
Cozy and existing Vibrant dark companions retain their palettes.

Sidebar secondary ink is matched to the deeper second-variant rails: Personal
`#354b40`, Group `#573b20`, maintaining at least 4.5:1 sampled text contrast.

Vibrant light canvas is deepened slightly after the soft-card review: Personal
`#d5e0d8`, Group `#e6d5be`, with matching translucent headers. Sidebar and
card values stay unchanged so the intermediate surface is easier to distinguish.

Cozy sky/blue-mint panels now lean greener: `--panel-sky` is `#dcebdc` in
light mode and `#3d574d` in dark mode. The discovery prompt and comparison
card share this token, retaining their lightness and avoiding a cyan cast.
