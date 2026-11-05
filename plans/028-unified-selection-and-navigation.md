# Unified selection and navigation controls

Status: proposed; planning only. Implementation is not authorized by this plan.
Created: 2026-11-04.

## Problem and goal

Sprout shares selection mechanics, but tab-like controls still configure their
own shapes, spacing, selected indicators and icons. Personal/Groups uses a
separate implementation, so it can look unrelated to Expenses/Income even though
both present a small set of choices. The names of the shared components also
make the extent of reuse hard to understand.

Create one visual foundation, exposed through three behavior-specific public
components: `Tabs`, `SegmentedControl` and `Navigation`. The same appearance
options should produce consistent controls without treating a filter, a content
panel and a page link as the same interaction.

This covers mobile and desktop, Personal and Groups, and Cozy, Elegant and
Vibrant in light/dark/system mode. It does not change ledger data or permissions.

## Starting point

- `ui/Tabs.tsx` provides controlled `Tabs`, `TabList` and `TabPanel` for Budget
  Expenses/Income and Import/Export.
- `ui/SelectionControl.tsx` supplies tab or pressed-button selection mechanics.
  Several named wrappers configure its labels and styles.
- `ui/controls.tsx` exports the existing `SegmentedControl` facade.
- `ui/NavigationItem.tsx` renders desktop sidebar and mobile navigation items.
- `groups/ContextSwitch.tsx` separately owns Personal/Groups links, pending state,
  navigation guards and the sliding indicator.
- Shared scroll hooks distinguish content-panel height stabilization from
  desktop page scroll resets. A local follow-up places `AppShell` in a persistent
  workspace layout to prevent route completion replaying mount animations.

Audit the actual branch before implementation, including whether that local
route-layout follow-up has landed. Do not reintroduce the double-mount behavior.

## Proposed component boundary

| Public component | Responsibility | Examples |
| --- | --- | --- |
| `Tabs` | Select a linked content panel within a page | Expenses/Income, Import/Export |
| `SegmentedControl` | Select a filter or presentation mode | Week/Month, Today/Recent, reporting periods |
| `Navigation` | Select a page or financial context | Sidebars, bottom navigation, Personal/Groups |

All three use an internal visual foundation for the track, items, icon/label
alignment, focus treatment and selected indicator. That foundation has no domain
knowledge, route ownership, data fetching or implicit scroll policy. It is not
another competing public tab API.

### Shared presentation API

Use a small typed set of presentation options rather than per-consumer radius
classes or unrestricted active-state class callbacks:

- `shape="pill" | "rounded"`: controls the track, item and indicator together.
- `size="compact" | "regular"`: consistent padding and type roles; both retain
  at least 44px interactive targets.
- Layout variants for horizontal segments, vertical rails and bottom navigation.
- Shared optional icons and translated labels; icon-only variants require
  accessible labels and, where appropriate, tooltips.
- Selected-state and indicator styling derived from semantic theme tokens.

Define shape/radius roles centrally. Preserve the current appearance-specific
corner treatments through semantic roles; do not silently turn every control
into a pill. Initial migrations should explicitly retain each control's intended
shape. Changing which controls use which shape is a separate design decision.

Keep layout customization narrow and separate from behavioral props. A caller
must not be able to accidentally give the selected indicator a different shape
from its containing control or override focus/disabled behavior.

### Behavior contracts

**Tabs** retain linked tab/panel IDs, roving focus, disabled-option skipping,
Left/Right with RTL support, Home/End, and a no-op when reselecting the active tab.
Keep lazy mounting and screen-owned draft state explicit. Scroll stabilization
is opt-in on the content panel, not an automatic effect on every control.

**SegmentedControl** retains pressed-button group semantics and its owner's
callback. Clicking the active choice must still reach that callback when it
reopens a reporting-date picker or performs another existing domain action.
Transaction Scope keeps its horizontal swipe behavior without hijacking
vertical scrolling. Filters do not automatically gain tab-panel semantics.

**Navigation** retains `aria-current`, route callbacks and active-page mappings.
Support real links with native modified-click/new-tab behavior where applicable;
do not turn routing into tab-style automatic activation on arrow focus.
Navigation does not reserve content-panel height. Existing page scroll handling,
browser Back/Forward and persistent shell ownership remain intact.

Personal/Groups becomes a `Navigation` variant using the common presentation
foundation. Its domain wrapper continues to resolve destination routes, enforce
guards, respect permissions, display pending state and identify the ledger.
Its variable-width indicator remains supported, with exactly one transition per
accepted navigation. Do not replace guarded routing with a generic `onChange`.

## Consumer and wrapper policy

Keep thin named wrappers when they add translated domain labels, typed values,
route resolution, guards or gestures. Examples include reporting periods and
Personal/Groups. Remove wrappers that only duplicate styling or forward an
identical public API. A retained wrapper must delegate presentation to the common
foundation rather than become a fourth implementation.

Independent filter chips, switches, checkboxes, calendar dates and dropdown
options are outside this consolidation. Their existing semantics remain valid.

## Implementation sequence

1. **Inventory and baseline:** map every current consumer to its behavior type.
   Capture current shapes, targets, keyboard behavior, scroll policy, guards and
   active-choice callback behavior. Identify meaningful wrappers versus styling
   aliases. Record any remaining design decisions before changing appearance.
2. **Foundation and API:** introduce shared presentation roles and typed options.
   Adapt the three public components while retaining compatibility for consumers
   not yet migrated. Add focused interaction and visual-contract tests.
3. **Content tabs:** migrate Budget and Import/Export. Verify linked panels,
   draft handling, disabled import flows and stable scroll positions. Preserve
   the persistent route shell and single-animation behavior.
4. **View/filter switches:** migrate Overview, reporting periods, recurring
   views, cash-flow breakdowns and appearance selectors. Preserve date-picker
   reopening and Transaction Scope gestures.
5. **Navigation:** migrate Personal/Group rails and bottom navigation, then move
   Personal/Groups onto the shared visual foundation. Verify guards, pending
   states, context labels, browser history and modified links.
6. **Cleanup and documentation:** remove obsolete style-only wrappers and
   conflicting CSS overrides. Update `docs/shared-navigation.md` and the design
   system with the final public API, migration rules and shape tokens. Mark this
   plan complete only after the agreed consumers are migrated and verified.

Each slice should remain reviewable and runnable. Do not combine this with a
palette redesign, navigation reordering, schema changes or a new draft lifecycle.
Pushing or updating a PR still requires the user's explicit permission.

## Acceptance and verification

- All three behavior types use the common presentation foundation. Personal/
  Groups no longer owns a parallel track/item/indicator styling system.
- `shape` consistently affects the track, items and selected indicator. No
  consumer-specific radius override is required for ordinary use.
- Targets remain at least 44px. Icons do not expand label rows or change track
  height unexpectedly; selected states do not change label geometry.
- Exactly one selection/route transition occurs per action on desktop and
  mobile. Controls remain anchored during content-tab changes; page navigation
  retains its own scroll behavior without replaying mount animations.
- Keyboard, RTL, focus, disabled and pending states work. Repeated clicks cannot
  bypass a guard or dispatch duplicate navigation. Back/Forward and deep links
  resolve to the correct section and ledger.
- Validate translated/long labels, narrow widths, collapsed sidebars and touch
  layouts in all three appearances and both resolved color modes. Confirm
  reduced motion and emitted production CSS, not only JSX class names.
- Use unit/component tests for behavioral differences and browser checks for
  geometry, focus, scroll continuity and single transitions. Include a real
  touch/PWA check where available and report unavailable device coverage.
- Run lint, the relevant regression tests and the production build. Run the full
  test suite for the completed migration and satisfy the repository's pre-push
  checklist before any approved push.

## Decisions to settle during inventory

- Which controls should intentionally look alike, beyond sharing a shape API?
  Preserve current intended shapes until that mapping is reviewed.
- Which domain wrappers provide enough value to remain as named components?
- Can the context switch's variable-width sliding indicator be expressed as one
  foundation variant without adding complexity to ordinary tabs?

These are implementation/design review questions, not permission to start work.
