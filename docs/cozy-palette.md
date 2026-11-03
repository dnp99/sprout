# Cozy palette

Cozy restores the Nov 1 palette (`00ed0c5`, 9:06 pm Toronto), while preserving current layouts, controls, keyboard accessibility
and transaction behavior. The former artwork-based Cozy palette remains
available separately as [Elegant](elegant-palette.md).

| Role | Light | Dark |
| --- | --- | --- |
| Canvas | Warm cream `#fbf7ef` | Warm stone `#33312d` |
| Personal card | Cream `#fffdf8` | Green stone `#39433f` |
| Personal navigation | Sage `#a4b88d` | Mint green `#3b594c` |
| Group navigation | Apricot `#e8b48c` | Warm stone `#474640` |
| Personal primary | Sage `#d4e2bf` | Mint `#b8e5c3` |
| Group primary | Apricot `#e8b48c` | Pale apricot `#efcc97` |

Supporting panels use sage, mint, peach, butter and blue-green. Group uses the
warm family, Personal the green family. Light phone controls retain the prior
sage highlight and quiet peach Group canvas; dark tokens match desktop.

`src/app/cozy-palette.css` contains restored palette/context tokens.
`src/app/cozy-colors.css` restores color-only surface mappings. Both load after
shared styles. Neither restores historical layout or interaction rules.
The shared Cozy/Elegant styles retain current typography, spacing, geometry,
controls and 24px cards. Vibrant is unchanged.

Storage remains `sprout-visual-theme=cozy`, so previous Cozy selections show the
restored palette automatically. System/Light/Dark remains independent. Choosing
Elegant explicitly saves `elegant`; there is no server or financial-data change.

Recent contrast fixes remain: selected calendar amounts use body ink rather
than muted ink, and keyboard focus/selected-toggle treatments retain their
current behavior. Restoring a palette does not roll back accessibility fixes.

The initial restoration recovered base colors but inherited newer solid selected
fills. Cozy now also restores soft calendar segments and mode-switch selection,
card-filled shared segmented controls, and the light Group avatar's apricot
primary fill. The mode switch keeps its current animation, 70/30 sizing and
icon-only inactive option; this is a color restoration, not a layout rollback.
Nov 1 and pre-artwork Nov 2 base palette declarations match; changing the named
baseline alone would not fix the inherited selection styles. Elegant and
Vibrant retain their own selections.

### Group sidebar control colors

Desktop Group context-switch and picker controls use the group rail's warm
apricot/stone selection and ink tokens. Generic card controls must not restore
Personal sage ink inside this rail. The same rail roles resolve to the warm dark
palette; Personal's sage sidebar and other themes retain their own tokens.

Desktop Personal Transactions uses the soft selection tint for its column header
and the stronger sage panel token for the totals footer, emphasizing the visible
total. Both roles resolve through Cozy’s existing light/dark palette.

Group Overview selected-date circles and Income summary surfaces use the warm
butter panel role across desktop/mobile and light/dark modes. Positive monetary
values keep their semantic green ink; Personal’s sage surfaces are unchanged.
