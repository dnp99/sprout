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

`ui/SegmentedControl.tsx` is the public pressed-button API. Internal
`SelectionControl` owns disabled choices, pressed states and keyboard selection
for it and `TabList`. Clicking an active segment still reaches its owner (for
example, reopening Month); reselecting a content tab is a no-op. Domain wrappers
retain translations, typed values and gestures, but no selected-state callbacks
or per-item radius classes:

- Overview calendar Week/Month and Today/Recent;
- Transaction Scope in both ledgers, preserving horizontal swipes and vertical scrolling;
- reporting periods, recurring List/Calendar, cash-flow chart and breakdown modes;
- account appearance selectors and transaction-entry/settlement view switches.

These remain named button groups with `aria-pressed`, rather than claiming to
control linked tab panels. Independent filter chips, calendar dates, switches,
checkboxes and dropdown options retain their own appropriate semantics.

## Page navigation

`ui/Navigation.tsx` exports `Navigation` and `NavigationItem` for Personal/Group
desktop rails, shared mobile bottom navigation, Budget/Goals and Personal/Groups. It owns active state (`aria-current="page"`), accessible
labels, icon/label layout, collapsed-rail titles and keyboard focus styling.
The existing routing callbacks and secondary-page active mappings remain at
the call sites. Navigation never uses tab-panel height reservation or automatic
content-tab activation. Desktop shells reset their content viewport to the top in a layout effect
before rendering a new section, and suppress the router's competing automatic
scroll pass. Same-page rerenders keep their position. Mobile retains its existing
scroll policy. Rail labels keep the same weight between active/inactive states,
with only colors transitioning, so selection does not change text geometry.

## Shared presentation API

All three public APIs use internal `selection-presentation.ts` attributes and
`src/app/selection-controls.css`. Only the behavior engines differ. Track,
items and indicator inherit the same shape roles (`--choice-shape-track` and
`--choice-shape-item`), so changing shape cannot leave a mismatched indicator.

| Option | Values and use |
| --- | --- |
| `shape` | `pill` (999px track/item/indicator) or `rounded` (10px track, 7px items/indicator). Omit for the preset's existing geometry. |
| `size` | `compact` uses label typography and 8px inline padding; `regular` uses body typography and 12px padding. Both retain 44px targets. |
| `appearance` | `standard` primary selection; `surface` existing neutral view-switch treatment; `calendar` existing palette-specific calendar geometry/colors; `choices` separate bordered appearance options. |
| navigation layout | `rail`, `mobile`, `segments`, or weighted two-link `context`. Mobile keeps five equal slots and 56px targets. |

Presets are centralized visual roles, not theme conditionals in domain components.
Calendar retains rounded geometry in Vibrant and pills in Cozy/Elegant; explicit
`shape` overrides a preset consistently. Navigation keeps its existing rail and
bottom-bar dimensions. All color roles resolve from semantic CSS variables, with
Cozy/Elegant/Vibrant and resolved light/dark selections scoped centrally. There
are no consumer-provided active-class functions. `className` is for placement and
width only, never item geometry, focus, disabled or active styling.

Options may supply an `icon` slot alongside a translated label. Use
`accessibleLabel` when an icon-only option has no visible text. Navigation always
requires a text `label`, including collapsed/icon-only links. Labels and icons
share flex alignment; selection does not change their font weight or geometry.

`NavigationItem` supports real Next links through `href` and button callbacks
otherwise. Disabled links suppress activation. Native modified links are not
intercepted, and arrow focus never navigates. The Personal/Groups wrapper alone
resolves routes, records the accepted context handoff and runs discard guards.
An immediate ref lock prevents duplicate guards or route dispatches; pending
state follows the real transition. The source shows pending feedback without
moving the indicator. Only the destination plays the weighted indicator handoff,
once; ordinary visits remain still and reduced motion disables the animation.

The former style-only `sidebar-style`, mobile geometry export,
`NavigationItem.tsx` alias and context-switch stylesheet are removed. `controls.tsx`
now contains only Toggle/Chip; import the public SegmentedControl module directly.
Meaningful wrappers remain for translations, routes, typed domain values and
swipe gestures. Filters, assignments, draft ownership and scroll policies are
unchanged; the persistent workspace shell remains the sole route owner.

## Verification

Shared tests cover tab/panel IDs, roving focus, disabled choices, RTL direction,
Home/End, tab same-selection no-ops and pressed-button reactivation semantics. Scroll tests cover
viewport bounds, nested scrolling and resizing. Existing calendar, transaction
scope and mobile navigation tests protect domain behavior during reuse. Additional
tests cover native/disabled links, async discard-guard locking, source indicator
stability, and picker focus restoration after clicks on nested label slots.
The migration passes automated checks; live browser geometry across palettes and
physical touch/PWA checks remain outstanding because those surfaces were unavailable.

The shared root declares `data-scroll-behavior="smooth"` so Next.js can suspend
global smooth scrolling during route transitions while retaining smooth in-page
anchor navigation. This avoids a second scroll animation after the new page
has rendered.

## Persistent route shell

Authenticated section pages and Group routes live in the `(workspace)` route
group under the localized layout. Its shared layout mounts `AppShell` once;
route leaves return null. URLs and deep links are unchanged. The menu's immediate
state update and subsequent Next.js route completion therefore share the same
app instance instead of remounting controls and replaying mount animations.
This applies to desktop sidebars and mobile bottom navigation. Login, logout
and password recovery retain separate route boundaries. Group identity keys
still intentionally reset group-specific state when changing groups.

Overview's Today/Recent agenda keeps a footer action slot in both modes. Its
record area is content-sized, capped at 280px for scrolling, and retains only
the measured height used by the current dataset across mode switches. Empty
lists stay compact. Changing the month, calendar mode or record IDs resets the
measurement so removed records do not leave a permanent gap. The daily-mode
footer is invisible, disabled and excluded from keyboard/accessibility navigation;
Recent retains View all transactions. Metadata reserves space for two lines.
This is shared by both ledgers, responsive layouts and every appearance.

## Transaction category sidebar hierarchy

The shared desktop `TransactionFilterRail` accepts optional `parentId` and
`accessibleLabel` metadata. Personal and Group category rails render roots with
indented child lists, independent disclosure buttons, and short child names.
Full paths remain in accessible names and tooltips to distinguish repeated names.
Groups start expanded; users can collapse them without changing the filter.
Changing selection to a child reopens its parent. Counts and checkmark columns
stay aligned without moving labels when selection changes. The compact icon rail
retains every category with its full accessible path. Income source rails remain
flat. Existing semantic tokens apply across all appearances and light/dark modes.

This is a presentation change only: selecting a parent still filters its exact
ID and its count includes direct assignments only; selecting a child filters that
child's exact ID. No parent roll-up, assignment restrictions, synthetic categories,
or mobile filter changes are introduced. Counts continue to respect the existing
transaction scope before category selection.
