# Account and ledger navigation

All ledger contexts, palettes and device layouts share this navigation model.

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
