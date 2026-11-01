# Ledger color balance

Color identity follows the ledger context in both themes. Cozy retains its
sage/green Personal and warm apricot/stone Group families. Vibrant uses the
approved Sky Blue Personal and Light Bright Orange Group palettes across
web and mobile; see [appearance.md](appearance.md#selected-vibrant-surface-hierarchy).

## Vibrant: surface area, not card count

The existing desktop Overview 65:35 major/companion grid is retained. Its
surface roles now vary lightness within a single blue or orange family rather
than mixing green and orange or adding a second companion hue. Neutral data
surfaces use the selected family's tinted near-white. Phone layouts reuse the
same roles and tokens while keeping their own responsive composition.

Each shell resolves `--context-major`, `--context-major-alt`, `--context-minor`
and `--context-minor-alt`. Components share these roles without branching by
theme. Secondary text uses the surface-specific `--panel-muted`. Financial
status text and user-defined category colors retain their independent meaning.

Vibrant keeps hairlines and its existing 14px card geometry; Cozy keeps its
borderless 24px cards. The old green/orange and green/blue Vibrant mappings are
superseded by this selection.

## Cozy: interleaved color families

The screenshot-led refinement supersedes strict 65:35 geometry for Cozy.
The ratio is an overall warm/cool direction, not a measured split or permanent
colored column. Green includes sage, mint, blue-green and bridging yellow;
orange includes apricot, soft peach/rose and bridging yellow. Personal remains
cooler overall; Group leans warm. Dark companions retain the selected warm-stone
style rather than introducing rusty red or orange-black contrast.

Personal Overview varies the row widths (equal discovery prompts, 57:43 hero,
53:47 activity, 43:57 insights). Warm recent records sit opposite mint merchants,
and yellow categories sit opposite blue-mint charts. The hero and checklist can
have natural heights rather than being stretched to match. Group Overview has
two larger spending/income panels above a smaller yellow budget and wider warm
category panel. This rearranges existing content without adding financial
metrics or changing calculations. Cozy keeps borderless 24px cards; Vibrant's
65:35 composition and surface assignments remain unchanged. Mobile layout is
still deferred; all composition overrides are desktop-scoped.

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
