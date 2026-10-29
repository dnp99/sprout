# Cozy feature workspace composition

Cozy extends Overview's cream canvas and sage/mint, butter and peach family to
Transactions, Budget, Goals, recurring bills and Settings. Surface roles live in
`src/app/cozy-workspaces.css`; components use `data-cozy-surface` rather than
hard-coded colors. Vibrant keeps its existing panel treatment.

Transactions uses a peach category rail/footer, butter search, sage table header
and mint rows. Budget assigns the larger category group to mint and its smaller
companion to peach; the summary uses butter. Goals cycle mint/peach/sky. These
roles follow the broad cool/warm balance of Overview rather than rigid columns.
The pure helpers in `src/lib/appearance/workspace.ts` share these assignments
between desktop and mobile.

All icons use ordinary monochrome Lucide strokes in currentColor, matching the
adjacent text. There are no added circles, cutout masks or decorative icon
backgrounds. EntitySymbol preserves persisted emoji identities while resolving
them to the same unframed SVG language. Decorative icon-only span/div holders
are transparent; real buttons and selected choices keep their interaction states.

Cozy chart marks remain opaque with a small chroma lift, rather than becoming
grey through opacity/desaturation. The chart brand blends the positive color
with sage for legible bars/rings. Chart panels recede toward the card token,
leaving labels, tooltips, semantic financial colors and stored category/goal
accents intact. Light/dark adapt through the existing variables.

These are presentation changes only: calendar interactions, accounting, money
values and stored symbols do not change. Together is a read-only design reference.

## Overview category spending ring

The shared CategorySpendingBreakdown replaces the short category budget list on
Personal Overview (desktop and mobile). Desktop puts the full-width calendar
above a two-card reporting row: category composition and spending over time.
The ring includes every category with positive net spending in its selected
month, including uncategorized entries; it never truncates to the top four.

The month starts from the shared view-month context and can be changed locally
without altering the calendar or transactions filters. The center displays the
total, or the selected category amount. Hover, keyboard focus and click/tap on
legend rows highlight their segment. The complete amount/percentage list is the
accessible alternative to the decorative SVG.

The pure builder reuses categorySpentForMonth: excluded transactions and income
are omitted, reimbursements offset their assigned category, and net-zero or
net-credit categories have no positive slice. The denominator is the sum of
positive net category spending, rather than the budget or gross expenses.
Amounts remain integer cents. Category accents are gently mixed with the card
token for light/dark support. Empty months and loading have explicit states.

## Calendar-first Home and global capture

Cozy Personal and Group overview compositions place the existing calendar first.
The ordering is scoped to Cozy; Vibrant retains its prior content order.
Once the core activation tasks (budget and first transaction) are complete,
ActivationChecklist returns no Home panel. The budget hero fills the freed
desktop row. Optional goals and recurring tasks remain accessible through
Settings → Learning & checklist, with an expandable tutorial guide and an
expanded checklist. Completion is still derived from actual account data.

useActivationItems shares setup completion and navigation between Home and
Settings on desktop/mobile. The Settings panel explicitly opts out of automatic
hiding. Tutorials reopen the existing budget, transaction, recurring and goal
screens rather than creating separate mutation flows.

QuickAddButton is placed before desktop header time controls on every Personal
view and every active Group view. Group capture uses that group's EntryForm;
busy/loading/archived ledgers disable it, and existing draft-discard confirmation
is retained. Personal capture resets stale add-form state and opens AddModal.
Primary mobile headers offer the same action in compact form, opening the Add
screen. Existing transaction-page actions remain available.

## Compact capture discovery

Home no longer displays separate voice/text and bank-import discovery banners.
Both features are entries in the shared activation checklist and Settings
tutorial. They are learning requirements, with an explicit Got it action; opening
a feature does not silently mark it learned. Acknowledgements are stored locally
per account under sprout-learning-<user-id>, with same-tab and cross-tab updates.
Once core setup and these learning steps are complete, Home hides the checklist.

Transactions keeps two permanent, short icon-and-text actions: Voice & text and
Import statement. Desktop voice capture opens the existing Connected apps panel
in a dialog without leaving the ledger; mobile opens Connected apps. Import uses
the existing import screen. No separate setup or import business logic is added.

Cozy Add transaction actions use the existing butter-yellow panel-lemon surface
and normal ink, matching the former yellow discovery tile. Vibrant retains its
primary action color.

## One recent-transactions surface

Personal Home (desktop and mobile, both palettes) no longer duplicates recent
transactions in a standalone card. The calendar agenda remains the single
recent-transactions list, including its View all transactions action and
selected-day mode. Desktop Frequent spots occupies its own full-width row,
with a compact empty state so removing the companion card leaves no gap.

## Linked chart card

The independent reporting cards described above have been superseded by one
shared spending-insights card and one set of time/category controls. Ring,
category amounts and time comparison now update together; categories found in
only one period remain separately visible. See [overview-insights.md](overview-insights.md)
for period cutoffs, non-overlap, refunds and positive-area pie semantics.

## Group warm-dominant surfaces

Cozy Group rail cards, context switch and selected nav items use extremely pale
peach rather than white. Overrides are scoped to the rail so they do not recolor
Personal or content controls. Directory cards and shared Group Panels declare
peach/butter/mint surface roles; create/join use a roughly 65:35 warm/cool row.
Group overview uses warm spending/budget tiles with a mint income companion.
Calendar/report cards use quiet peach tints. This shares Personal's surface
language and light/dark tokens while making warm tones more prominent.

## Structural parity with Vibrant

Calendar-first ordering now applies to both visual themes, superseding the
earlier Cozy-only ordering. All report/date/menu/group interactions are shared;
the Cozy-scoped surface overrides remain palette-specific. Vibrant retains
neutral surfaces, hairlines, compact radii and its existing context accents.

## Stable layout hooks

The desktop budget columns and edit action opt into `cozy-budget-layout` and
`cozy-budget-edit`. The group rail opts into `group-sidebar`. Their Cozy rules
do not depend on direct-child nesting, generic grid classes or background utility
classes, so adding wrappers or changing a utility does not drop their theme.
