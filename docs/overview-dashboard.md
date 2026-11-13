# Overview dashboard

Personal and Group Overview use `OverviewDashboard` with full-width financial
metrics above independent card stacks. Wide layouts place Calendar, Budget and
Frequent spots on the left; Recent transactions and the spending preview on the
right. Narrow layouts retain Calendar → Recent → Budget → Frequent → preview in
actual DOM/keyboard reading order, followed by existing contextual actions.
Cards have natural heights and share semantic surfaces, spacing and typography.
The existing sidebar, bottom tabs, account settings and entry composers remain.
Mobile Overview uses the title/badge/avatar header, replacing the earlier Home
greeting convention. Long names truncate or wrap without shrinking touch targets.

## Data and periods

`PersonalOverview` uses the shared Personal `viewMonthKey`, also consumed by
Transactions, Budget and Bills. New sessions start in the current month, matching
Group. The desktop header uses `PersonalOverviewPeriod` with the existing month
picker; mobile Overview changes month through its calendar, with no extra
snapshot picker, also matching Group. Its calendar reads/writes that same key. The current month
retains the authoritative API `summary`; other months reuse `monthTotals` and
the current Personal budget pool, matching the existing Budget view. Personal
budget history is not stored, so other months explicitly identify current budget
settings and suppress live allowance, days-left and payday guidance. Choosing a month
does not clear explicit Transactions date filters or write independent Trends periods.

The current-month adapter reuses
`buildBudgetHero` for available spending, over-budget state, days left, allowance,
pace coaching and payday information. It never substitutes a cash balance for
safe-to-spend. Personal's zero budget retains its existing unconfigured meaning.
`GroupOverview` consumes only its authorized `GroupSnapshot`: selected-month
spending/income, their existing net definition, and saved pool minus spending.
Group `budget.exists` distinguishes an unconfigured budget from a configured zero.
Group budgets never use Personal daily-allowance or safe-to-spend rules.

The snapshot heading labels each adapter's period. Personal's header, calendar,
summary and spending preview stay synchronized. Its API budget summary remains
current-month; browsing other months derives scoped totals locally. Group calendar
navigation changes the Group month through the existing loader. Loading uses
skeleton/dash states, rather than showing stale summary values as a new month.
Existing shell error handling and authorization remain in force. There are no
new requests, financial definitions, migrations, or combined ledger stores.

Frequent spots reuses `topRecurringMerchants` with three rows. Its rolling
30-day window includes today and the preceding 29 ledger dates, independently of
the Overview month. Old data cannot anchor the window backwards, and future-dated
records are excluded. `groupTrendSource` supplies the complete non-voided
Group history; missing complete history shows loading, never a paginated total.

`SpendingPreview` reuses `buildOverviewInsights` and its refund/comparison engine
with an explicit month-end cutoff. It covers the full labeled month, including
future-dated records, matching the snapshot's full-month semantics. Top-three
shares use the engine's positive-category denominator; net credits remain in the
headline and are explained when present. No baseline produces “No comparison
yet”, rather than a fabricated change. Data is never merged between ledgers.

## Calendar and recent records

`EverydayCalendar` opts into `dashboard` layout through Personal/Group wrappers.
The mode controls and day grid occupy one card; the synchronized Today/Recent
scope and record list occupy a separate card. Week/Month selection, independent
month/week arrow actions and selected-day behavior retain their existing state and
timezone conventions. The two cards align at the top of independent columns and never stretch each
other. An optional `renderCards` callback passes both cards from the single
`EverydayCalendar` controller to `OverviewDashboard`; standalone calendar users
retain their existing layout. Calendar mode, selected day and agenda scope live
above responsive card composition and survive column changes. Dashboard mode removes the historical measured minimum record height;
other calendar consumers retain their existing presentation.

Recent mode keeps its existing visible week/month scope. Picking a day selects
the daily list. Dashboard lists show at most five recent rows, with the full
record count still visible. Group rows include the actual payer label. Names and
metadata truncate; signed amounts wrap safely and positive cash uses semantic
green. The View all action stays available in either scope. Personal's action
clears unrelated advanced filters and supplies explicit inclusive month bounds
(including leap years); Group navigates through its existing selected-month route.
Edit actions and archived-group restrictions remain in the ledger adapters.

## Detailed analysis and navigation

Overview no longer mounts the full `OverviewSpendingInsights` report. Personal's
former filters, distribution, category/payer lists and cumulative comparisons
remain available through `DetailedSpendingAnalysis` in desktop/mobile Trends.
This native disclosure mounts the existing report on demand. Group retains its
existing detailed Trends workspace. No analytical engine was removed.
Explore Trends changes only the active page/route and preserves the selected
group. It does not synchronize or overwrite independent Trends period/filter
state. The preview explicitly explains that Trends owns its reporting period.

## Responsive presentation and verification

Summary metrics use two columns on phones and four on desktop.
`OverviewCardLayout` observes available content width (including sidebar and
mobile max-width constraints). At 856px or more it renders two equal-width flex
stacks with 16px gaps, giving each calendar at least 420px. Below that width it
renders one stack in the actual mobile reading order. Exactly one copy of every
card is mounted; no CSS-only reading-order changes or duplicate interactive
layouts are used. Calendar and Recent never share a height-defining grid row.
Space beneath the shorter overall column remains natural, without gaps between
its cards. The insights preview uses its own container width to decide whether
three categories fit side-by-side; narrower cards use readable stacked rows. Money wraps within bounded cards. Existing card
radius and color tokens preserve Cozy/Elegant/Vibrant identities in both modes.
Bottom clearance derives from the floating record action's measured height on
phones and reserves desktop clearance, so final actions can scroll above it.
Progress transitions respect reduced motion; all action targets remain 44px.

Regression tests cover ledger isolation/group changes, missing budgets, period
ownership, full-month/refund preview totals, bounded category lists, independent
calendar cards, recent row limits, selected-date navigation and the retained
advanced report. Merchant totals and category amounts wrap within their cards,
including unusually large values and narrow localized layouts.

### Verification (November 2026)

- Full Vitest suite: 885 passed, 50 skipped. Lint, locale-key parity and production
  build/type checks passed.
- Local Chrome fixtures used the real dashboard components and production CSS,
  with fictional, isolated ledger data and mocked account/navigation services.
  106 layout cases covered Personal/Group, 320/375/390/430/768/1024/1440px,
  Cozy/Elegant/Vibrant light/dark, empty/loading/unconfigured/archived states,
  large amounts and narrow French layouts. No horizontal page/card overflow or
  final-action/floating-button clearance failure was found.
- Browser interaction checks at 390px and 1440px covered complete Month grids,
  selected dates and agenda synchronization, the five-row Recent limit, week
  navigation, group replacement and Transactions/Budget/Trends callbacks.
- These fixtures do not verify signed-in backend access, native-device keyboards
  or physical-device safe-area behavior. Existing permission/data tests remain
  responsible for authorization; no new data endpoints or permissions were added.

### Recent-activity and Personal period correction

Frequent spots now anchors to today rather than the newest imported transaction.
Regression tests cover stale-only ledgers, the inclusive 30-date boundary and
future/invalid records. Personal's formerly read-only header period is now a
picker. Personal now shares its remembered month across ledger views, and mobile
uses only its calendar control, matching Group. Tests cover current/API versus
other-month totals, refunds/exclusions, calendar synchronization, and shared Personal month ownership and independent explicit filters/Trends state. The final full suite passed 909 tests (50
skipped), lint and production build/type checks passed. Chrome fixtures at 390px
and 1440px verified November-to-October selection, matching financial/calendar
values and picker opening without writes to other reporting filters. These are
isolated component fixtures, not signed-in backend or physical-device tests.

### Independent-column refinement

The approved [layout plan](../plans/overview-independent-columns.md) replaces the
row-aligned Calendar/Recent and Budget/Frequent grids. `OverviewCardLayout` is
shared by both adapters, with an optional `CalendarCardLayout` callback passed
through their calendar wrappers. Other calendar consumers retain their existing
composition and controls; no financial or filtering logic changed.

Validation: lint/locale parity, standalone TypeScript, production build and the
full Vitest suite passed (911 tests, 50 skipped). Regression tests cover one-copy
rendering, mobile DOM order and calendar/date/agenda state across width changes.
A local Chrome fixture using real components and production CSS passed 224 cases
across both ledgers, eight widths (320–1440px), all three appearances/light-dark,
Week/Month modes and empty/few/many/large/loading datasets. Geometry checks covered
immediate 16px stacking gaps, balanced columns, stable calendar width, no card/page
overflow and floating-action clearance. Separate browser interactions retained
mode/date/scope across resizing, verified the preview's own-width layout and
existing Budget/Transactions/Trends callbacks, and replaced selected-group data.
Fixtures use fictional isolated data; signed-in backend, physical-device and
assistive-technology checks were not performed.

The shared [calendar spending presentation](calendar-spending.md) improves daily
amount visibility without changing calendar totals or the independent card stacks.
