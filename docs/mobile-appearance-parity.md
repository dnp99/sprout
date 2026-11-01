# Appearance parity on mobile and desktop

On mobile and desktop, Cozy and Vibrant share page content,
controls, container dimensions, font sizes, line spacing and content density.
Their existing colors, card/container corner radii and button shapes remain
distinct. This parity rule is explicitly approved for desktop as well.

Screens use shared components rather than theme-specific render paths.
The remaining geometry exceptions in `src/app/controls.css` are normalized:

- Select popovers use 6px padding and 10px icon/label gaps in both appearances,
  including portaled menus inside dialogs and Group views.
- Selected calendar view labels use weight 600 in both appearances; other
  labels retain weight 500.
- Calendar padding is 14px below 640px and 22px at 640px and above.

The existing 44px select targets, shared type sizes, line heights and calendar
cell dimensions are retained. Transparent Cozy borders retain their box width.
Color-only shadows, selected-date outlines and theme-specific rounded shapes
do not change layout dimensions and remain part of the appearance treatment.

Future convenience changes apply to both mobile appearances. Changes to design
logic or functionality require asking whether desktop should also change.

Desktop also shares the existing Vibrant component grids: the Categories budget
sidebar remains 320px and Overview uses its common context grid. Cozy no longer
applies separate column ratios, Group grid areas, panel minimum heights or gaps.
This supersedes earlier Cozy-only composition notes in the design system.
