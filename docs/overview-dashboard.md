# Overview dashboard

Personal and Group Overview use `OverviewDashboard` with the same order:
financial metrics, independent Calendar/Recent cards, Budget/Frequent spots,
a three-category spending preview, then relevant navigation/setup actions.
Cards have natural heights and share semantic surfaces, spacing and typography.
The existing sidebar, bottom tabs, account settings and entry composers remain.
Mobile Overview uses the title/badge/avatar header, replacing the earlier Home
greeting convention. Long names truncate or wrap without shrinking touch targets.

## Data and periods

`PersonalOverview` adapts the existing current-month API `summary` and reuses
`buildBudgetHero` for available spending, over-budget state, days left, allowance,
pace coaching and payday information. It never substitutes a cash balance for
safe-to-spend. Personal's zero budget retains its existing unconfigured meaning.
`GroupOverview` consumes only its authorized `GroupSnapshot`: selected-month
spending/income, their existing net definition, and saved pool minus spending.
Group `budget.exists` distinguishes an unconfigured budget from a configured zero.
Group budgets never use Personal daily-allowance or safe-to-spend rules.

The snapshot heading labels each adapter's period. Personal's API budget summary
remains current-month; its calendar can browse independently. Group calendar
navigation changes the Group month through the existing loader. Loading uses
skeleton/dash states, rather than showing stale summary values as a new month.
Existing shell error handling and authorization remain in force. There are no
new requests, financial calculations, migrations, or combined ledger stores.

Frequent spots reuses `topRecurringMerchants` with three rows. Its existing
rolling 30-day window is anchored to the latest available eligible transaction,
not to the Overview month. `groupTrendSource` supplies the complete non-voided
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
month/week navigation and selected-day behavior retain their existing state and
timezone conventions. The two cards align at the top and never stretch each
other. Dashboard mode removes the historical measured minimum record height;
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

Summary metrics use two columns on phones and four on desktop. Supporting cards
use two columns when space permits; Calendar/Recent are side-by-side on desktop
and stacked on phones/tablets. Money wraps within bounded cards. Existing card
radius and color tokens preserve Cozy/Elegant/Vibrant identities in both modes.
Bottom clearance derives from the floating record action's measured height on
phones and reserves desktop clearance, so final actions can scroll above it.
Progress transitions respect reduced motion; all action targets remain 44px.

Regression tests cover ledger isolation/group changes, missing budgets, period
ownership, full-month/refund preview totals, bounded category lists, independent
calendar cards, recent row limits, selected-date navigation and the retained
advanced report. Browser/device coverage and any limits are recorded at delivery.
