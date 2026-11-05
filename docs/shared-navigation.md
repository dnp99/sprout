# Shared selection and navigation

Sprout distinguishes content tabs, view/filter switches, and page navigation.
All are controlled: their owning screen still owns state, permissions, data,
URL updates and mutations. Components share semantic theme tokens across Cozy,
Elegant and Vibrant in light/dark mode, 44px minimum targets, keyboard focus and
reduced-motion behavior. Appearance-specific corner and border rules remain.

## Content tabs

`src/components/ui/Tabs.tsx` provides `Tabs`, `TabList` and `TabPanel`. Budget's
Expenses/Income and desktop/mobile Import/Export use these primitives. The list
has a translated accessible name, roving keyboard focus, selected state and IDs
linking every tab and panel. Left/Right (respecting RTL), Home and End activate
an enabled tab and focus it without scrolling. Hidden placeholders preserve
inactive panel ID targets without mounting inactive forms or fetching twice.
The active panel supports keyboard focus; a 140ms opacity transition applies
only to incoming content and is disabled for reduced motion.

Use `stabilize` when shortening a panel would otherwise clamp scrolling. Before
selection changes, `useStableTabPanel` reserves only the visible space in the
nearest scroll container, intersected with the visual viewport. Window,
container and visual viewport resize events update that reservation, including
mobile keyboard and orientation changes. It does not reserve the old list's
full height or apply animation to unrelated page headers.

Screen-owned drafts and import mappings remain in their owners. Inactive nested
forms retain the existing lazy/unmount behavior; tabs do not introduce an
implicit draft persistence policy. Import busy fieldsets still disable changes.

## View and filter switches

`SelectionControl` owns option rendering, disabled choices, pressed states,
keyboard selection, focus styling and minimum targets. Clicking the active
segment still calls its domain callback (for example, reopening the Month
picker), while reselecting a content tab is a no-op. The existing exported
`SegmentedControl` delegates to it, retaining its API. Domain wrappers supply
labels/icons, styling and their existing callbacks:

- Overview calendar Week/Month and Today/Recent;
- Transaction Scope, retaining its own horizontal swipe handling;
- reporting periods, recurring List/Calendar, cash-flow breakdowns;
- Budget/Goals page switching and account appearance selectors.

These remain named button groups with `aria-pressed`, rather than claiming to
control linked tab panels. Independent filter chips, calendar dates, switches,
checkboxes and dropdown options retain their own appropriate semantics.

## Page navigation

`NavigationItem` renders Personal/Group desktop rails and the shared mobile
bottom navigation. It owns active state (`aria-current="page"`), accessible
labels, icon/label layout, collapsed-rail titles and keyboard focus styling.
The existing routing callbacks and secondary-page active mappings remain at
the call sites. Navigation never uses tab-panel height reservation or automatic
content-tab activation. Desktop shells reset their content viewport to the top in a layout effect
before rendering a new section, and suppress the router's competing automatic
scroll pass. Same-page rerenders keep their position. Mobile retains its existing
scroll policy. Rail labels keep the same weight between active/inactive states,
with only colors transitioning, so selection does not change text geometry.

## Verification

Shared tests cover tab/panel IDs, roving focus, disabled choices, RTL direction,
Home/End, tab same-selection no-ops and pressed-button reactivation semantics. Scroll tests cover
viewport bounds, nested scrolling and resizing. Existing calendar, transaction
scope and mobile navigation tests protect domain behavior during reuse.

The shared root declares `data-scroll-behavior="smooth"` so Next.js can suspend
global smooth scrolling during route transitions while retaining smooth in-page
anchor navigation. This avoids a second scroll animation after the new page
has rendered.
