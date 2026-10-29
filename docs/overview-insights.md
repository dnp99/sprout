# Linked Overview spending insights

Personal Overview uses one shared OverviewSpendingInsights card on desktop and
mobile, replacing the independent category/month and spending-comparison cards.
A month stepper, comparison preset and category selector control both views.
The presets retain month versus previous month, month versus six-month average,
and year versus previous year. Year mode includes January through the selected
month, comparing the same progress in the preceding year.

Category selection filters both the ring and timeline. A legend row or ring
segment selects that category; the All categories option restores the complete
view. Clicking an already selected legend row also clears the filter. Changing
time preserves the category choice, including an explicit empty result when it
has no matching records. Hover alone does not alter the financial filter.

## One accounting and period engine

buildOverviewInsights delegates every series, including per-category current and
comparison amounts, to buildOverviewSpendingComparison. It therefore shares
refund offsets, exclusion and income rules, current-month day cutoffs, historical
month ends, same-progress yearly comparison and six-month averaging. All monetary
amounts remain integer cents. Historical tooltips name the selected periods
rather than incorrectly calling them this month/year.

All nonzero categories across the two periods are included. Shared categories
and non-overlapping categories are separate list groups; the latter explicitly
identify Selected period only or Comparison period only. A comparison-only
category remains selectable and visible with zero current spending, rather than
disappearing from the report. Unknown stored category IDs retain their transaction
name; null category IDs are translated as Uncategorized.

The ring partitions positive net category spending. A net credit cannot occupy
positive pie area: its signed amount remains in the list and timeline/headline,
while the pie has no negative slice. Thus with a net-credit category, positive
slice percentages are shares of positive category spend, not net cash movement.
The six-month average rounds per category to integer cents, so summing displayed
category comparison averages can differ slightly from the aggregate average.

## Presentation

One quiet card uses theme tokens in Cozy/Vibrant and light/dark. The ring/list and
time chart sit side by side on desktop and stack on mobile. Category accents
remain gently mixed with the card surface; chart marks retain readable contrast.
The visible amount/percentage list is the accessible alternative to the decorative
ring, with keyboard-accessible category selection and shared Select controls.
Loading and empty results are explicit. The existing chart chooses bars without
a meaningful baseline and a cumulative comparison when a baseline exists.

## Payer dimension and category intersection

View by switches the ring/list between Category and Payer; the timeline always
uses the same underlying selection. Independent payer and category selectors
intersect, so choosing a payer then Category shows that payer's categories.
Selecting a payer row/segment filters by that payer; selecting a category row
filters by category. All payers / All categories clear the corresponding filter.

Personal transactions belong to the account owner; no other payer is fabricated.
Group reports preserve GroupEntry.payerId, including Shared funds for null payers.
They do not confuse the payer with the entry author or split participants.
Refunds retain their signed cents and payer attribution.

Group snapshots now include reportEntries: the complete authorized, non-voided
ledger independent of the 50-row transactions page and calendar range.
GroupSpendingInsights adapts those records to the shared reporting engine.
Group Overview and Trends use the same component, with their header month
controlled by the group shell. Historical/averaged comparisons therefore never
silently operate on a paginated or month-only sample. The existing group
membership authorization runs before this data is returned; no permissions or
schema change is introduced. Until reportEntries is loaded, charts show loading.

## Reporting-date picker

The month control includes a CalendarDays button opening a themed compact
calendar (ReportDateControl). Monthly and Monthly avg. support year/month/day
selection. Selecting a day supplies throughDate to the same period engine, so
current spending and its comparison stop at the same day-of-month. Full month
clears that explicit cutoff; the existing current-month progress rules then
apply. Payer/category choices remain intact. Month stepping and switching
comparison modes clear the explicit day cutoff.

Yearly mode presents year/month choices; selecting a month defines the
year-to-that-month comparison and does not offer a misleading daily selection.
Year/month headings switch to their own small selection grids. Today jumps to
the current reporting date. Previous/next controls navigate the displayed grid;
outside click or Escape closes it, restoring keyboard focus to its trigger.

The widget reuses calendarDays UTC arithmetic, MonthSelector and Popover.
Mint/peach fills follow Personal/Group context and theme tokens. It opens on the
side with more viewport space, clamps horizontally, and scrolls on short screens.
The widget does not affect the Home ledger calendar or change financial data.

## Mobile reporting controls

Below 1024px, Reporting period stays visible while comparison, view-by, payer
and category controls collapse behind Filters. The trigger exposes its expanded
state and controlled region. A visible summary keeps the comparison and active
payer/category choices apparent when controls are closed. Reset filters restores
the default monthly/category comparison and clears the explicit day cutoff.
Desktop shows the same controls without the disclosure; both themes share this
behavior. The group header labels its month Ledger month to distinguish ledger
context from report controls. Group report month changes still synchronize the
shell month; personal report changes remain local to the report.

Today in the report picker uses the same device-local date helper as the ledger
calendar and entry defaults. UTC is retained only for date-only grid arithmetic,
not for determining the user's current day.
