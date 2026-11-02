# Elegant artwork palette

Elegant uses the supplied abstract painting as its color reference: warm ivory,
forest green, muted olive and ochre. This palette is preserved from the former artwork-based Cozy theme. Cozy now
restores the earlier Together-inspired sage/apricot palette and Warm Apricot /
Stone dark palette. Both ledgers now use the same theme;
Vibrant also shares its Sky Blue palette between Personal and Groups.

| Role | Light | Dark |
| --- | --- | --- |
| Canvas | Ivory `#f4f0e4` | Forest charcoal `#202923` |
| Card | Warm white `#fcf9ef` | Deep olive green `#2c352c` |
| Navigation (both spaces) | Forest `#345448` | Deep forest `#263f35` |
| Actions (both spaces) | Forest `#345448`, ivory text | Pale sage `#c7d3af`, dark text |

Forest supplies readable body ink in light mode; warm ivory supplies it in dark
mode. Panels are pale green, olive, linen and gold tints in light mode, with
muted companions in dark mode. The legacy `panel-peach`/`panel-rose` variable
names now resolve to olive/linen tints to preserve component roles without
renaming every consumer. Gold is an accent rather than a full-page wash.

Tokens live in `src/app/globals.css`; `src/app/cozy-workspaces.css` maps them to
existing surfaces. Both ledgers and viewport sizes share the same palette.
Phone record striping and quiet cards use mixtures of these tokens;
there are no separate phone primary colors. Greetings use readable primary ink,
rather than a pale action fill. Navigation owns local ink and selection tokens
so both forest rails use cream/gold. Ivory
controls nested inside a rail restore page ink, including the context switch,
account menu and collapse control.

Appearance switching preserves layouts, dimensions, fonts, rounded corners,
content density and behavior. Financial status hues remain semantic and
user-selected category colors remain data. Select Elegant in Appearance to use this palette. Its browser preference is
`sprout-visual-theme=elegant`; existing `cozy` preferences select restored Cozy.

## Calendar navigation

Elegant calendar navigation now uses an artwork-inspired ochre (`--calendar-accent`,
`#c99a45`) with dedicated forest ink (`--calendar-accent-ink`, `#263f35`). The
selected date circle uses this yellow; the month strip, navigation arrows and
selected day's background use a subtle 14% ochre/card mixture (24% on hover).
Active calendar segments retain forest/ivory in light mode and sage/dark ink in dark mode.
The pair is shared in light/dark mode, Personal/Group and mobile/desktop.
Transaction filters and other segmented controls retain primary/on-primary
colors. Vibrant, geometry and calendar behavior are unchanged. Focus outlines
remain visible and hover uses a quieter mixture of ochre and card.

## Mobile navigation selection

The active bottom tab uses the same primary/on-primary pair as selected
segments: forest fill with ivory icon/text in light mode, pale sage with dark
icon/text in dark mode. Both Personal and Groups share this treatment; inactive
tabs remain muted on the card/canvas. The icon and label explicitly inherit the
selected tab's ink so their usual primary-link classes cannot reduce contrast.
This replaces the previous pale mixed selected fill; geometry is unchanged.

## Charts and trends

Elegant charts use forest, olive, sage, ochre and linen series tokens, with lighter
companions in dark mode. The shared chart brand follows primary. Category rings
and their legend use the same `categoryChartColor` helper: six legacy built-in
hex accents resolve through `--chart-category-1` … `--chart-category-6`. Saved
values remain unchanged; Vibrant resolves the same slots from its own primary,
income, warning and muted tokens.
Other custom colors remain intact. A custom selection exactly matching a legacy
hex is indistinguishable from a built-in default and receives its theme mapping.
Payer series use theme slots independently of category order. Existing trend bars,
comparison lines and cash-flow income/expense semantics retain theme tokens.
All mappings apply to both ledgers and responsive shells, with no migration.
Spending-insight report month controls share the calendar's subtle ochre treatment.
