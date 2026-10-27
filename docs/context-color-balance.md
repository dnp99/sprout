# Ledger color balance

Both visual themes follow the ledger context: Personal uses a green navigation
rail and green-dominant content; Group uses a warm orange navigation rail and
orange-dominant content. This applies in light and dark mode. Cozy dark retains
the approved Warm Apricot / Stone colors, so orange means warm stone/apricot
rather than saturated rust or dark red. Vibrant uses more restrained tints.

## Vibrant: surface area, not card count

Vibrant desktop Overview pairs major and minor surfaces in a 65:35 grid, excluding
gaps. Equal-height cards keep the colored surface area aligned with that ratio.
Personal pairs green major surfaces with orange minor surfaces; Group reverses
the mapping. The Group overview summary uses two major tiles totaling 65% and
one minor tile occupying 35%. Neutral canvas, data tables, form fields, dialogs,
text and user-defined category colors are outside the color-area denominator;
the rule does not mean 65% of all screen pixels must be tinted green or orange.

`--panel-sage` / `--panel-mint` define the green family, and `--panel-peach` /
`--panel-butter` define the orange family. The historical butter token now uses
an orange-cream companion rather than a separate yellow family. Each ledger
shell resolves these into `--context-major`, `--context-major-alt`,
`--context-minor`, and `--context-minor-alt`. The matching CSS classes are shared
by personal and group summaries, with no component branches for themes.
Secondary text uses a surface-specific readable token. Income/expense text,
status, and category colors retain their financial meaning independently of
these decorative backgrounds.

Cozy keeps borderless 24px cards. Vibrant keeps hairlines and its existing card
geometry; its colored overview surfaces replace the earlier all-neutral ones.
The desktop layout owns the 65:35 area split; phone composition remains a later
pass, as requested. Future paired feature panels should reuse these roles and
`context-color-pair` rather than hard-code green/orange by position.

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
