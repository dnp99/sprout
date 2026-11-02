# Account and ledger navigation

All ledger contexts, palettes and device layouts share this navigation model.

## Compact search and explicit dates

Selection actions (Select/Done and page/matching/all-record choices) use a
shared `selection-action` fill: 32% active primary mixed into the card surface,
with a modest hover increase. Record checkboxes use borderless, pale peach/card
mixes only while unchecked. Native Group checkmarks and Personal primary-filled
checked states retain their existing appearance; keyboard focus remains visible.
The treatment applies to mobile/desktop and both appearance palettes. Other
checkboxes keep their existing treatment.

Personal and Group Transactions place a 44px outlined magnifier button directly
left of Select above the records, on mobile and desktop. `SearchDialog` opens
the shared small modal with keyboard focus, Escape/close/backdrop dismissal and
the active palette. Slash opens desktop search. Full-width page search bars are
removed; the Rules list uses the same compact entry. Search fields inside form
option pickers remain local to their editor.

Group search contains query, actual payer and date-scope controls. Personal
search retains categories, amount bounds, clear filters and saved views. The
legacy mobile Search destination reuses Transactions instead of maintaining a
second independent search page.

All dates is the initial scope. A month becomes inclusive first/last-day bounds;
an exact date uses the same start/end date. Existing saved custom ranges remain
available. An empty query never introduces an implicit selected-month filter.
Explicit calendar navigation still selects that month/day through the same date
bounds. Personal mobile summaries total the visible result set, excluding
internal moves and preserving reimbursement accounting.

Group bounds are validated server-side and intersect query, payer and kind
before pagination; invalid dates and reversed ranges are rejected. The store
sends bounds on every page request. Group authorization, ledger ownership and
integer-cent accounting are unchanged. Search/date regressions cover leap-year
month ends, inclusive edges, invalid dates, modal opening/dismissal and complete
ledger filtering.

## Transaction workspaces and group membership actions

On mobile and desktop, Personal and Group Transactions begin with the shared
`TransactionTools` row: Bills & recurring and Import & export. Group additionally
offers Split & Settle. Buttons wrap at narrow widths, retain 44px targets and
consume the active Cozy/Vibrant semantic tokens. These are navigation actions;
opening them never imports, exports or calculates a split automatically.

Bills, Import and Group Settlement routes highlight Transactions in the primary
navigation. Their direct URLs remain valid. Mobile Personal Import returns to
Transactions. The previous standalone sidebar destinations, Group More menu,
Personal Settings import link and mobile Home/Budget bills entry cards are
removed. Transactions also omits the Voice & Text entry on mobile and desktop;
capture remains available through Connected apps and onboarding tasks.

Personal and Group Settings embed `GroupDirectory` membership actions: standard
Create group / Join group buttons expand one matching form. Existing members
see only their group choices in the ordinary Group directory. A user with no
groups gets the same two buttons on the Group homepage after membership loading
completes. Direct invitations still open the explicit review/accept flow, even
for existing members. Embedded Settings controls never auto-redirect to a sole
group. Creation retains its retry identity and joining retains the disclosure
and explicit acceptance; navigation changes do not alter either permission flow.

The former `GroupSecondaryNavigation` is replaced by these scoped entry points.

## Account header

The greeting and account avatar appear above the Personal / Groups switch, rather
than inside the Home page. The avatar opens a local Account settings dialog; it
never navigates out of a Group. This contains name/profile editing, password and
security controls, visual palette, System/Light/Dark, language, notifications and
logout. Existing account APIs and permissions remain unchanged.

Avatar initials pair foreground-token fill with canvas-token text, giving
opposite light/dark contrast rather than placing ink on the muted text color.
Collapsed desktop rails show only the avatar; this preference does not hide the
mobile greeting.

## Ledger settings and planning navigation

Mobile tabs are Home, Transactions, Budget & goals, Trends, Settings. Settings
occupies the far-right slot and opens the current ledger's settings, not account
preferences. Personal Settings contains budget, currency/cycle, import/export,
connected apps, merchant rules, businesses and setup/device support panels. Group
Settings retains membership, categories, splits and other existing Group controls.

Budget & goals is one navigation destination with an inner Budget/Goals switch.
The underlying pages, URLs, state and domain operations remain independent;
opening Goals highlights the shared planning navigation slot. Desktop uses the
same combined sidebar entry and inner switch. Existing direct Goals routes remain
valid. Group-only destinations remain in secondary navigation.

## Persistent record action

Home and Transactions always display the floating calendar-styled Add record
control, including at the top of the page. The wide centered Add record entry is
also retained. The calendar agenda no longer renders its own add button beside
Recent transactions, avoiding another duplicate in that card. Floating controls
retain palette-specific color/shape and stay above mobile bottom navigation and
safe areas. They use the existing active-ledger composer and disabled rules.

This supersedes the earlier scroll-triggered floating-action behavior and the
older Settings → Appearance navigation described in earlier design notes.

## Calendar header action and Group Home title

On mobile, the Group Home name occupies a complete header row, centered in a
plain `bg-card` surface with the existing hairline border and 10px corners.
It has no decorative gradient, texture or shadow. Multiple-group selectors
reserve equal side padding so their chevron does not offset the name. Cozy and
Vibrant share the layout and use their own semantic colors; desktop retains its
compact tinted title.

The wider Add record action now occupies the calendar's former title/hint area,
next to the Week/Month control; neither heading nor hint is visually rendered.
Its background/ink use the same primary-soft/primary-ink tokens as the selected
agenda date segment, preserving the current palette's light orange or companion
context tint. It opens the existing composer for the selected calendar date.
The always-visible floating action remains on Home and Transactions; the former
wide shell-level action is removed. The calendar agenda still has no extra plus.

Group Home displays its actual group name in a bold, tinted title box instead of
Home plus a group-name subtitle. With multiple available groups this is the shared
Select list, routing through the existing context-preserving group switch. A
single group shows a static name box. Pending operations disable switching. Other
Group pages retain their section title and current group subtitle. These changes
apply to mobile and desktop and both appearance palettes.

## Logout control

Account, Personal and Group settings share `LogoutAction`: a 16px Lucide LogOut
icon and translated label using `text-primary`, so both follow the active
Cozy/Vibrant, light/dark and ledger palette. The existing border, rounded corners,
44px minimum target and `/logout` destination are preserved.

## Page-specific header controls

Record creation entry points appear only on Home and Transactions in Personal
and Group, on mobile and desktop. Home retains the calendar header action; both
pages retain the persistent floating action. Generic page headers no longer add
a duplicate record button to Budget, Goals, Bills, Import or Settings. Settings
headers never show a reporting month/date selector. Date controls on other
reporting pages retain their existing behavior.

## Independent month and week navigation

The arrows beside the month heading always change calendar months, landing on
the first day of the adjacent month. In Week view, a second pair flanks the
date-number row beneath the Monday–Sunday labels; these move seven days while
preserving the selected weekday. Crossing a month boundary updates the owning
ledger's month through its existing callback. Month view hides the week arrows.
Week arrows use the existing calendar-arrow shape and primary-soft/primary-ink
colors with a 16px arrow plus 0.5mm padding on each side and 44px height in all palettes and responsive
layouts, reserving only the needed horizontal space beside the date cells.

Calendar cells keep the date in a fixed 27px upper slot with 6px top spacing.
The date uses a 12px line centered in its unchanged 27px highlight holder.
The amount/dash reclaims the holder's lower 7.5px and centers between the date
digit line's bottom edge and cell bottom border, rather than the holder bottom,
consistently in Week/Month and all palettes.

## Highlighted record actions

The calendar Add record action and persistent floating plus now use primary-ink
fill with canvas-colored text/icons, plus a subtle theme-derived halo and raised
shadow. This supersedes their earlier date-highlight soft fill. Hover and keyboard
focus reinforce their affordance; corners, dimensions, placement and disabled
behavior remain unchanged across ledgers, device layouts and palettes.

## Mobile calendar month-picker placement

Below 1024px, the calendar month label beneath Add record uses the shared
ReportDateControl, including its previous/next month arrows and month/year
dropdown. Group Home hides its duplicate title-row month control at this size;
Personal and Group use the same in-calendar control and their own existing month
state. Choosing a day in the picker selects that calendar day; month selection
lands on day one. Separate week arrows remain beside the date row. Desktop
headers and their original in-calendar month controls are unchanged.

The in-calendar mobile month selector has no outer border and uses the same
12px type, muted track and selected primary-soft/primary-ink colors as Week/Month.
This styling is local to that mobile control; desktop and other month pickers
retain their existing treatment.

Spending insights reuses the same mobile `calendar-month-control` treatment for
its reporting-date picker, including Personal/Group and all palettes. Existing
period selection behavior and desktop styling are unchanged.

## Mobile bottom-navigation selected state

### Group mobile Trends report parity

Group mobile time controls now follow [Group report periods](group-report-periods.md)
on both Trends modes and Budget & Goals. This supersedes the mode-specific
month picker described below.

Group Trends reuses Personal's `MobileTrendsReport` and mobile Cash Flow body:
Cash flow / Spending switch, two-column summary tiles, charts, breakdowns,
CSV export and spending detail sections share geometry and typography. Spending
period controls sit in the header. Group's existing payer/category filters and
comparison analysis follow the Spending report. Group Home and desktop reports
retain their existing analysis layout.

Fresh Group visits default to Spending with the Month period, matching the
reviewed mobile preview; Cash flow remains available through the view switch.

Mobile Cash flow shares `MobileReportStat` with Spending and shows a labeled
net-savings headline above its chart. Group Budget and Goals use the same
two-column compact summary and quiet bordered detail surfaces. Budget summaries
show saved pool, allocation, spending and remainder; Goals show saved/target
totals and total/reached counts. These summaries describe saved data, not unsaved
budget edits. Existing budget editors, goal actions and desktop composition stay
in place. Mobile Budget / Goals uses the same card-backed switch treatment as
Cash flow / Spending. Cozy and Vibrant share geometry and semantic colors.

The Group adapter uses the complete authorized `reportEntries`, excludes voided
records and preserves refund/reimbursement semantics and integer cents. Loading
does not show a partial page as a complete report. Categories, recurring items,
selected month, mode and period remain Group-scoped; chart selection never
writes Personal report preferences. The shared cash-flow scope regression test
checks Group selection isolation and the unchanged Personal fallback.

Mobile Personal and Group tabs use Transactions, Budget & goals, Home, Trends,
Settings order, placing Home in the center. Home uses a slightly heavier 2.5px
icon stroke; the other icons retain 2px strokes. Both appearances share this
arrangement. Desktop navigation is unchanged. Default app entry remains Home
(`/home` for Personal and the group root for Group), independently of tab order;
explicit deep links still open their requested destination.

The active mobile tab uses a 10px rounded primary-soft background in addition to
its primary-colored icon and semibold label. The fill follows the active ledger
and appearance palette (including dark mode). Inactive tabs remain transparent;
target dimensions and desktop navigation are unchanged. Goals highlights the
shared Budget & goals tab.

Personal Cozy's selected mobile tab mixes 20% primary into primary-soft for a
slightly deeper sage fill; Group and Vibrant selected-tab colors are unchanged.

### Mobile Group activity history

Group Settings initially renders the ten latest activity events on mobile.
“Load more” appends ten older events per click, stopping at the latest 100 or
when history runs out. The server's existing newest-first, 100-event snapshot
is reused without a refetch. Switching groups resets the visible count; live
updates preserve the expanded count. Desktop retains its existing full snapshot
view. This behavior is shared by Cozy and Vibrant and uses semantic theme tokens.

## Mobile density and account identity

Mobile page titles and month controls share one row. Month labels abbreviate on
phones (for example, Nov 2026) while previous/next targets remain 44px. The group
name stays below its title and truncates if necessary. Wider multi-period report
controls retain their own row; desktop month labels and layout are unchanged. Transaction browsing keeps secondary
workspaces (recurring, import/export, and Group split/settle) under **More**.
Personal category, sort, and additional type controls live in the search/filter
dialog; spent/income totals use a compact inline summary. Group AI categorization
is available within More. Desktop transaction tools retain their existing layout.

Home keeps one persistent mobile record action: the calendar's inline Add record
button is desktop-only. The mobile action occupies a solid strip above bottom
navigation, keeping the button off record amounts. Mobile navigation labels use
11px text, record metadata uses 12px text, and date/scope/report mode controls
provide touch targets of at least 44px. Both appearances share this geometry.

Desktop account identity uses a circular avatar before the greeting above the
ledger context switch; collapsed rails retain an avatar-only account entry point.
