# Mobile Transactions

Personal and Group Transactions share a compact layout below the existing `lg`
boundary (1024px). `mobile-transactions.css` owns the scoped phone overrides;
desktop/tablet layouts at or above `lg` retain their existing chrome and tables.
Colors come from semantic theme variables across Vibrant, Cozy and Elegant,
including each light/dark variant. No accounting, API or permission rules change.

## Structure and shared components

- `AccountHeader` accepts an optional Transactions identity slot. The existing
  avatar still opens account settings locally. `TransactionSpaceBadge` supplies a
  bounded icon/name pill; Group keeps its existing chooser when multiple groups
  are available. Other pages retain their greeting and context subtitle.
  The group chooser paints a 28px-high pill capped at 140px wide, with a
  transparent 44px-high trigger centered over it. Long names truncate while
  the full name stays accessible and the dropdown keeps its touch target.
- `ContextSwitch` keeps route guards, weighted selection and motion; only the
  Transactions wrapper reduces its surrounding padding while retaining 44px links.
- `MobileHeader` and the Group header place the existing month picker and tools
  actions on one row. Import and Group Split are direct 44px icon buttons, each
  with its translated label as a native tooltip (`title`) and accessible name.
  Personal shows only its available Import action. Desktop keeps its labeled
  toolbar. Month/day picking, reporting scope and disabled states remain
  owned by the existing controls.
- `TransactionScopeSwitch` and `SearchDialog` retain their shared selection,
  keyboard, swipe and advanced-filter behavior. Type segments use equal shares
  with intrinsic label minimums; unusually long translations can scroll within
  the control rather than overflowing the page or breaking words.
- `MobileTransactionTotals` uses two balanced cells with a divider, flow icons,
  tabular amounts and positive income ink. Integer-cent calculations and
  formatting remain at their existing call sites. Large amounts can wrap.
  Totals use 6px vertical padding and body-sized semibold amounts. The idle
  count/Select row borrows 4px of surrounding whitespace on either side while
  retaining its 44px button; active bulk toolbars retain their normal spacing.
- `MobileSelectionBar` becomes a plain count/action row when idle; active bulk
  selection retains its toolbar and full action disclosure.
- Existing row/detail/menu components remain in use. Transactions rows have a
  76px minimum, bounded amounts, truncated merchant metadata and 44px menu targets;
  Group retains payer/split information and can grow taller. Positive Personal
  amounts and Group refunds use the existing positive token on this surface.
- `ScrollRecordAction` clears measured bottom navigation, visual-viewport keyboard
  offsets and the Group pager. Page-end clearance reserves room for records and
  menus beneath the floating action. Existing keyboard hiding remains in place.
- Shared mobile tabs retain all five destinations and labels. The active icon
  has a compact primary highlight instead of filling the complete label tile.
  Other mobile pages inherit this navigation treatment; desktop navigation does not.

## Validation

Regression coverage includes Transactions account access, existing context guards,
search/filter behavior, selection across pagination, record actions, incremental
Personal lists and bottom navigation mapping. CSS must also be checked in the
production bundle and visually at narrow widths across all six appearance modes.
Physical iOS/Android keyboard, autofill and installed-PWA safe-area checks require
real devices; a browser preview cannot establish those platform behaviors.

Implementation checks: lint, production build/type checking and the full suite
pass (829 tests, 50 existing environment/integration skips). Isolated previews
rendered from the real components with fictional data and production CSS were
checked for Personal/Group across all six theme modes at 320px and 393px. No
horizontal page overflow was found; long group/merchant names remained bounded,
million-dollar totals fit at 320px, and record menus retained 44px targets. The
initial full run hit an unrelated manual-entry timeout; its focused rerun and
the subsequent complete suite passed without changes to that code.

Live authenticated add/edit flows, physical-device safe areas/keyboards and a full
desktop visual comparison were not exercised. The existing functional suite
covers selection, paging, filters, entry validation and navigation. No production
account data or deployment was changed for these layout checks.
