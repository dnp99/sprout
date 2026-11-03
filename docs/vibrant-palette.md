# Vibrant — Ink Navy

Vibrant uses Ink Navy `#1F2A44` for its sidebar, branding and primary accents,
Light Mist `#EEF2F7` for subtle selection/supporting surfaces, and Muted Steel
Blue `#3E5F8A` for prominent actions. Tokens live in `src/app/vibrant-theme.css`;
every selector excludes Cozy and Elegant. Theme switching/storage and all
component layouts, spacing, typography and responsive behavior are unchanged.

## Surfaces and states

The page canvas is `#FAFBFC`, cards white, body ink `#252B36`, muted text
`#667085`, and borders `#E4E8EF`. Secondary buttons and selection controls use
Mist with Navy ink. CTA hover/pressed fills are `#345276` / `#2B4565`, with
white labels. Floating record buttons and calendar record actions share CTA
roles. Existing disabled behavior/opacity remains unchanged; focus indicators
use theme outlines. No gradient or shadow treatment is introduced.

Desktop navigation uses Navy with pale labels and understated lighter navy
active/hover fills. Light card controls and Account menus inside the rail
restore page ink. Selected calendar dates use Mist and a Steel Blue outline;
unselected dates stay neutral. Calendar and filter tabs use soft secondary
fills instead of large saturated accents.

Transaction zebra stripes resolve to zero-percent tint, leaving neutral card
rows. Inset hairline dividers do not affect row heights or virtualized list
geometry. Hover uses Mist; selection and edited-state colors retain their
meaning and precedence. Icons, amounts, custom category accents and financial
status colors are preserved. Default charts use restrained steel/slate shades.

Dark mode uses neutral blue-charcoal surfaces, soft slate secondary fills,
pale text/links, and the same Steel Blue CTA with white labels. No indigo or
purple tokens remain in Vibrant. Cozy and Elegant keep their own palettes.

## Contrast

White on Steel Blue CTA is 6.54:1. Body, link, rail and action label pairs are
covered by CSS-token contrast tests in both modes. The exact muted ink
`#667085` passes on the near-white canvas and white cards, but is only 4.43:1
on Mist. Supporting secondary surfaces therefore use `--secondary-muted`
(`#606B7D` in light mode), preserving AA normal-text contrast. Dark mode has a
corresponding pale secondary ink. Disabled controls are exempt from normal
text contrast targets. Palette changes require no dependencies or migrations.
