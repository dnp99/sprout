# Cozy palette

Cozy restores the palette immediately before commit `0c1228d` (baseline
`bfd523f`), while preserving current layouts, controls, keyboard accessibility
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
