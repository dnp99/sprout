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

Personal and Group Transactions use the shared inline `SearchDialog` field on
mobile and desktop, leaving results visible during live query entry. Advanced
filters expand inline instead of covering the ledger. Slash focuses desktop
search. The Rules list shares this nonblocking entry. Search fields inside form
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

## Account access

Desktop Personal and Group rails use a bottom Account menu instead of an avatar,
name, or greeting. Its Profile, Appearance, Security, and Notifications entries
open the corresponding existing account panels without leaving the ledger. Log
out is a separate final menu item using `/logout`. The collapsed rail keeps a
user icon with an accessible Account label. Keyboard arrows, Home/End, Escape,
and outside clicks support menu navigation and dismissal.

Mobile retains the greeting/avatar above Personal / Groups and opens the full
Account settings dialog. Existing account APIs, logout behavior, and permissions
remain unchanged.

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

Mobile Home and Transactions display the floating calendar-styled Add record
control, including at the top of the page. Desktop Home retains its floating
action; desktop Transactions uses its toolbar action. The calendar agenda no longer renders its own add button beside
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

Home and Transactions keep one persistent mobile record action. Its transparent
dock sits 12px above the measured bottom navigation; only the button receives
touches. No opaque strip hides records, and bottom content padding keeps the
final row scrollable above the action. Mobile navigation labels use 10px text,
record metadata uses 12px text, and date/scope/report mode controls
provide touch targets of at least 44px. Both appearances share this geometry.

Desktop account access uses a bottom **Account** menu with a user icon and no
avatar, name, or greeting in the rail. Profile, Appearance, Security, and
Notifications open the existing account panels; Log out is separated below a
divider and uses the existing logout route. Collapsed rails retain the Account
icon. Mobile keeps its existing greeting/avatar above the ledger context switch.

### Mobile calendar amount labels

Phone calendar day cells use localized compact currency for totals of $1,000 or
more (for example, $1.4K), with a small horizontal inset. Smaller amounts retain
exact cents. The day’s accessible label, tooltip, selected-day summary and record
list retain full amounts. Desktop labels and all accounting stay unchanged.

## Shared palette, explicit context

Both ledgers retain the same selected visual theme and mode. Personal page
headers omit a redundant context line because the switch already identifies the
mode. Group headers retain Group · Maple House to identify the current group.
The context switch marks its selected link with a fill, checkmark and
`aria-current`. Group Home uses Overview as its section title, with its existing
multi-group route picker beside the header. See [context-color-balance.md](context-color-balance.md).

### Mobile tab label spacing

All five mobile tab labels stay at 10px, including wider phones, so Transactions
has breathing room inside its equal-width slot. Touch targets and two-line
Budget & goals labels are unchanged; all themes share the same typography.

Both mobile bars use five equal grid columns with a 4px gap. Each 56px-minimum
button contains an 18px icon and a reserved two-line label area, keeping icons
aligned when Budget & goals wraps. Labels stay inside their own column; small
phones below 360px use 10px text, larger phones use 11px. Full translated names
remain button accessible labels if a long translation exceeds two lines. Cozy's
selected fill is shared by both ledgers. Desktop navigation is unchanged.

Personal mobile Add opens the [shared transaction dialog](shared-transaction-entry.md)
over its originating screen, matching Group entry and retaining the active tab
beneath the modal. Both modes share the numbered keypad and field layout.

### Context switch motion

The active Personal / Groups option occupies 70% of the available track and the
inactive option 30%, excluding the 4px gap. A shared pill slides between sides
and the columns resize over 200ms, showing only the active label and selected
checkmark. Both palettes and screen sizes share this geometry; semantic theme
tokens supply color. Reduced-motion preference snaps directly to the result.

Because the two ledger shells remount across routes, a short-lived in-memory
marker hands the previous side to the destination. It expires after one second,
is not persisted, is scoped to the destination pathname, and never delays
navigation or changes ledger state. Initial
visits do not animate. Disabled/cancelled navigation and modified/new-tab clicks
do not record motion. Route mapping and existing navigation guards stay intact.

The inactive context displays only its icon; the active context displays its icon, label and checkmark. Both links retain translated accessible names and hover titles. This 70/30 layout is shared across mobile, desktop and both appearances.

## Category management in ledger settings

The Group category management panel uses the shared peach/orange surface token
to match the Group settings palette, including its existing dark-mode variant.
Individual category accent colors remain category-owned.
The Personal category management panel uses the shared mint/green surface token
in both appearances and layouts, with the token's existing dark-mode color.

The personal Monthly budget configuration card (budget amount, currency and
budget cycle) lives on the Budget page, above tracking on mobile and in the
budget sidebar on desktop. Its amount action opens the existing budget editor.
Personal Settings no longer includes this card. Both layouts share
`PersonalBudgetSettingsCard` so the displayed fields and behavior stay aligned.

Group creation and joining are available only in Group mode: the group
directory (for users without a group or following an invitation) and Group
Settings. Personal Settings does not render the group directory or its creation
and invitation forms. This applies to mobile and desktop in both appearances.

On mobile and desktop, Personal Settings includes a Categories panel with add,
edit/delete and Organize categories actions. The personal Budget page no longer
has an Organize categories entry; contextual category and budget editing remains
available while reviewing a budget. Group Settings retains its group category
panel with the same actions. These controls use semantic tokens in both Cozy and
Vibrant appearances.

Personal categories belong to the signed-in user (`categories.user_id`); group
categories belong to one group (`group_categories.group_id`). Both start from
`DEFAULT_CATEGORIES`, copied into separate records at creation. Custom additions,
renames, ordering, hierarchy, merges and deletion stay in their originating ledger.
Creating a group does not copy the user's custom personal categories, and later
changes to defaults in either ledger do not sync to another ledger.

## Desktop transaction workspace

Bills & recurring is temporarily omitted from the shared transaction toolbar
on mobile and desktop in both ledgers. Import/export and Group settlement
actions remain. The recurring feature, routes, forms and saved data are intact.

The Select/Done toggle sits with the business scope beside the table's kind
filters. Search and Add remain in the upper action toolbar. Business scope's
empty-assignment option is labeled Unassigned; it retains the existing no-business
filter value and behavior in every locale.

Personal desktop Transactions groups related workspace links, categorization,
search, selection and Add transaction into one wrapping toolbar. Transaction
kind chips and business scope share the next row; optional business summaries
and reimbursement information keep their existing rules. Add transaction uses
the existing reset/open action. Its prior floating button is removed only from
desktop Transactions, keeping the visible-total footer unobstructed. Home and
mobile record actions are unchanged.

Header and row columns share responsive minimum widths, including a dedicated
date column. Fixed row height is 64px through the same exported constant used by
virtualization. Reporting date and recorded timestamp stay within two lines;
the timestamp truncates on narrow widths and retains its full title. Notes sit
under merchant names, and category/source selectors stay editable with quieter
borderless controls and visible hover/focus feedback. Footer totals remain
nonshrinking. These layout changes apply to all three themes, preserving palette
colors and 44px controls. Mobile layouts and accounting/search behavior are
unchanged. Styling is scoped in `desktop-transactions.css`.

## Import/export placement

Desktop Personal and Group sidebars include Import & export immediately after
Transactions in the upper navigation list, including collapsed icon navigation.
It has its own active state; desktop transaction toolbars omit its duplicate
button. Group routing and pending-operation guards stay in the existing shell.
Mobile keeps Import & export in the transaction tools area as a direct action,
without a More dropdown. Group settlement and any categorization child action
remain visible there. Bills & recurring stays hidden from these toolbars. This
placement is shared across all themes; mobile bottom navigation is unchanged.

## Inline ledger search

Personal and Group now render the shared search field inline on desktop and
mobile. Text updates the existing query state live, leaving matching records
visible; no modal, scrim or focus trap covers them. The search component keeps
its historical `SearchDialog` export for callers, but uses an inline control.
The desktop slash shortcut focuses the field, and Clear resets the query while
keeping focus. Filters are a collapsed-by-default inline disclosure beneath the
field, with an explicit close button. Existing business, payer, category, date,
amount and saved-view controls retain their filtering rules and values when
collapsed. Search uses a full ledger row on narrow Group layouts instead of the
former icon-sized tools cell. No backend or pagination semantics change.

### Desktop selection entry

Desktop Personal and Group Transactions expose checkboxes directly; Select/Done
is reserved for mobile. Personal bulk actions appear after checking rows. Group
page/matching selection controls remain available with the always-visible desktop
checkboxes. Mobile selection behaviour is unchanged.

### Mobile result selection

Personal and Group ledgers share a count/Select bar above results, separate from
full-width live search. Selection shows the selected count, Select all and Done.
Group selection retains its existing bulk limit. Personal bulk controls sit after
the records and stick above bottom navigation in a bounded scrollable panel.
The shared search input hides native WebKit cancel decoration, retaining one
accessible Clear search button.

### Totals emphasis and desktop filter typography

Desktop totals use the shared transaction-total-bg token across themes: soft gold for
Elegant and each theme’s own primary-soft selection surface for Cozy/Vibrant,
resolving against each dark surface. Desktop live search uses 13px text and advanced filter
fields/Clear filters use 12px, matching surrounding controls. Mobile editable
fields retain 16px to avoid automatic input zoom.
