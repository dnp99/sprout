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
