# Appearance

Settings offers two independent controls on mobile and desktop:

- **Visual theme:** Vibrant ([Ink Navy](vibrant-palette.md)), Cozy (restored cream/sage/apricot), or Elegant
  (ivory/forest/olive/ochre, formerly the artwork-based Cozy palette).
- **Appearance:** System, Light, or Dark. System follows device changes live.

Cozy follows the [restored palette](cozy-palette.md); Elegant preserves the
[artwork palette](elegant-palette.md). Both use
Sprout's existing layouts, Geist typography, CSS variables, Tailwind classes,
and Lucide library. All three palettes support light and dark mode. Elegant is the default for existing and new visitors without a valid saved
palette choice. Saved explicit choices are respected.

## Financial-space identity

Personal and Groups share the selected theme choice. Cozy restores distinct
sage Personal and apricot Group colors; Elegant retains the shared forest palette. The [persistent context label](context-color-balance.md)
and checked Personal / Groups switch identify the active space. This supersedes
all earlier ledger-specific palette decisions below.

## Preference lifecycle

`src/lib/appearance/index.ts` owns preference parsing, persistence, DOM updates,
and the pre-paint script used by both root layouts. The Zustand store holds
`visualTheme` independently from `themePref` and resolved `theme`.

Every explicit palette choice is stored in `localStorage` as
`sprout-visual-theme=vibrant`, `cozy`, or `elegant`. Missing storage, including
older implicit Vibrant preferences, now resolves to Elegant. Existing `sprout-theme` light/dark storage is unchanged.
The root `data-visual-theme` attribute selects CSS tokens, while `.dark` selects
color mode. Unknown palette values fall back to Elegant. Storage failures allow
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

Cozy's primary fill uses contrasting `text-onprimary` (ivory on forest; dark on gold or pale sage). The semantic `text-primary`
and `border-primary` classes have separate ink/outline variables so links and
control boundaries remain readable on cream surfaces. Components must continue
using semantic classes rather than branching on the selected palette.

## Earlier palette decisions (historical reference)

Vibrant now follows [Ink Navy](vibrant-palette.md); older Sky Blue and Indigo values are
superseded. Cozy and Elegant retain their current palettes.

The Cozy and Elegant palette documents above define current colors. The notes
below record earlier decisions; current shared layouts and interactions apply.

### Together fusion — local first pass

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

Cozy sky/blue-mint panels lean greener: `--panel-sky` is `#dcebdc` in
light mode and `#3d574d` in dark mode. The discovery prompt and comparison
card share this token, retaining their lightness and avoiding a cyan cast.

## Selected Vibrant surface hierarchy

The approved full-page combination is **Sky Blue (晴空蓝)** for Personal and
**Light Bright Orange (轻亮橙)** for Group. It applies to web and mobile in the
existing Vibrant setting; Cozy remains independent. This replaces the earlier
botanical Personal palette, sand-orange Group palette and desktop-only scope.

| Role | Personal light | Group light |
| --- | --- | --- |
| Accent / primary fill | `#38a2ca` | `#f5ac64` |
| Navigation rail | `#95cadc` | `#fad7b5` |
| Canvas / soft selection | `#d4e8ed` | `#fff4e8` |
| Lightest card / field | `#fdfeff` | `#fffffd` |
| Text / logo | `#1e5570` | `#925721` |
| Secondary text | `#507b8e` | `#91633e` |
| Border | `#c2d8df` | `#f2dfc9` |
| Track / muted fill | `#f1f7f9` | `#fff8f0` |
| Text on primary | `#073448` | `#704315` |

Cards are the lightest surfaces with a very faint blue/orange tint; they are not
pure white. Secondary ink and text-primary use stronger family colors for
legibility rather than the pale button fill. Navigation secondary text uses the
stronger logo/text color against its richer background. Headers share the
canvas tint with translucency. Financial income, warning, danger and saved
category accents retain their established meanings rather than being recolored.

Dark Personal uses canvas `#112027`, rail `#1b3b48`, cards `#16252b` and ink
`#e6f2f6`; dark Group uses canvas `#211b16`, rail `#503c29`, cards `#332a22`
and ink `#faefe4`. The selected blue/orange accents keep darker foregrounds on
filled actions; links and selections use the lighter family ink. All surfaces,
including contextual panels, borders, muted fills and text, adapt together.

`globals.css` owns the token palettes. Context palettes resolve on every
`data-ledger-context` shell, including mobile Personal, both outer canvases,
and portaled select/confirmation/announcement wrappers. Components use semantic
classes; none needs per-theme inline colors. The unchanged Cozy layout rules
live in `cozy-workspaces.css` to keep the palette stylesheet focused and small.

## Current account entry point

Appearance and language controls now live in the account avatar dialog above the
Personal / Groups switch on both device layouts. Ledger Settings remains scoped
to the selected ledger. See [account and ledger navigation](account-and-ledger-navigation.md).

## Orange-dominant Group controls

Group scopes its action palette as well as its navigation rail. Cozy light uses
the existing peach/apricot fill, warm brown ink and peach selected surfaces; Cozy
dark uses the approved apricot/stone companions with warm-tinted content cards.
Vibrant light strengthens its existing peach selected fill and orange overview
surface. Group record actions use orange/apricot fill and their paired on-primary
ink rather than a brown text-colored fill.

Calendar/date highlights, selectors, navigation, progress accents and record-row
stripes consume these scoped tokens. Personal palettes, shapes, spacing, income
green, warning/danger colors and user-defined category accents are unchanged.
The same context selectors apply to mobile, desktop and portaled controls.

Group account greetings and avatars also use the shell's warm action palette.
Their accent variables resolve before sidebar-local overrides, so the greeting
stays warm brown/apricot and the avatar uses an orange/apricot fill with paired
contrasting initials even inside the navigation rail. Personal remains unchanged.

Group Budget remaining uses the peach surface instead of butter-yellow. Calendar
selected/today date circles use the companion ledger color: peach/orange inside
Personal's selected fill, mint/green inside Group's orange selected fill. The
27px circle and date/amount geometry remain unchanged; light/dark variants reuse
the existing panel tokens. The selected date receives this circle independently
of whether it is today.

## Mobile dark-mode parity

Mobile follows the corresponding desktop Cozy/Vibrant and Personal/Group dark
palette, including surfaces, text contrast, controls and highlights. Responsive
layout and interaction sizing may differ; dark color tokens remain shared.

### Cozy phone canvas and record hierarchy

In light-mode phone layouts, Personal retains its original cream page/header
canvas. Group uses a light peach canvas (12% peach panel tint mixed into cream)
consistently across the page and top navigation instead of the strong orange
rail fill. Neutral cards retain the same role in both contexts; Group's default
panels no longer all use the strong peach fill. Cream supplies the lighter
transaction row; alternating rows mix 65% of the corresponding sage/peach panel
tint into that cream. Continuous-list corners and selection/edit highlights are
preserved. Desktop, Vibrant and dark-mode palettes remain unchanged.

Personal Cozy phone transaction search, secondary filters and type chips use the
same sage action palette: primary-soft for idle controls, primary for the active
filter, and corresponding readable ink. Reimbursement, uncategorized and excluded
filters no longer introduce yellow, pink or separate blue-green fills. Labels
retain their existing meaning. Group, desktop and dark-mode tokens are unchanged.

Personal Cozy phone primary highlights use sage `#b2c597` (relative luminance
0.5163), matching Group apricot `#e8b48c` (0.5169). Dark sage ink yields about
4.57:1 text contrast, close to Group's 4.53:1. Add record, its floating action
and other primary-filled controls share this role, while quiet soft fills,
page backgrounds, desktop and dark mode retain their existing tokens.

Personal Cozy phone welcome text and avatar fill follow the same primary sage
highlight as Add record. Avatar initials use dark primary ink for contrast.
This account-chrome adjustment is limited to light-mode phone layouts.

Group Cozy phone welcome text also uses its primary apricot highlight, matching
its Add record action and avatar fill. Both ledger greetings follow the same
color-role logic; desktop and dark-mode account chrome remain unchanged.

Group Cozy phone calendar and Spending insights surfaces use a 16% peach/card
mixture. Their quiet depth matches Personal without copying its mint hue; Group
keeps a warm page and warm supporting cards. Complementary green date circles
and semantic positive/income colors retain their distinct roles.

Group Cozy phone Income summary cards also use the peach surface family. This
changes only the card fill; income amounts, accounting and positive-status ink
retain their existing behavior. Desktop and dark mode remain unchanged.
