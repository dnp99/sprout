# Settings layout

Personal and Group ledger Settings use `SettingsWorkspace`. Desktop (1024px
and wider) has a 220px section navigation column and a bounded content column,
inside a 1120px maximum workspace. Phones start at a grouped index; choosing a
row opens one section with Back to settings. Existing palette tokens, panel
radii and action styles remain in charge of appearance.

## Destinations and scope

Both ledgers offer Categories and Categorization rules in their Ledger group.
Personal also offers Businesses and Personal capture. Group adds Group details,
Members & invitations and Activity. Help & app contains Personal learning and
checklist access and a shared App & updates destination. Installation is shown
only when the existing PWA controller makes it available. Group Management
contains archive/reopen, leave, create and join controls, preserving their
existing permissions, confirmation and busy rules.

Account remains accessible from the desktop Account menu and mobile avatar.
Notifications has one form there. Appearance also contains the existing
on-device edited-record highlight preference, now using the shared Toggle.
Log out remains in Account rather than being repeated on ledger pages. Capture
credentials belong to the user; their records still target Personal. The capture
section explicitly states that scope and keeps advanced setup in its guide.

## Navigation and drafts

Section URLs use `#settings-<id>`. The original `#connected-apps` onboarding
anchor is also accepted. Unknown fragments show the mobile index or desktop's
first section. Selection replaces the fragment without changing routes, queries,
ledger state or the outer Group navigation guards. Hash/popstate changes are
read on the current page. The mobile Back to settings button returns to the
index; browser Back retains the surrounding route's existing history behavior.

The first panel and visited panels remain mounted, with inactive content hidden
from display and focus. This preserves inputs, category expansion, and one-time
capture token displays across section switches and responsive resizing. Other
panels mount when first opened, avoiding unnecessary initial requests. Section
selection never submits a form. Group's busy state disables local navigation.
Opening a section focuses its accessible heading and scrolls to its top; Back
focuses the index. Returning to a section starts at its top and retains drafts.

## Long content and controls

Both category lists offer search against the full category path. Parents remain
visible for matching children; parent matches include their children. Child
lists start collapsed and open automatically while searching. Add, Organize and
existing editors keep their separate ledger data and permission behavior.

Personal rules keep their detailed explanation behind How rules work, stack
fields on narrow screens and use the page scroller for the full list. Existing
rule application behavior is unchanged. Rule and capture creation/deletion
controls have at least 44px target heights. Personal Businesses keeps its card
on phones and places the name input on its own line. Group Activity reveals ten
more events at a time on desktop and mobile, capped at the existing newest 100
server-provided events.

## Verification

Navigation tests cover mobile index behavior, draft retention, responsive
switching, capture deep links, fragment updates and disabled group navigation.
Category tests cover path-specific edit labels; activity tests cover incremental
reveal and the 100-event cap. Account tests exercise responsive panel switching
without security submissions. No schema or accounting changes are involved.

Local verification passed ESLint, ES compatibility and catalog checks, the full
unit suite, focused settings/search regressions, and a Next.js production build.
Generated CSS contains the bounded workspace grid, responsive business form,
scroll offsets and disclosure indicators. Chrome smoke checks covered Personal
and Group desktop layouts, the 400px mobile index, 320px categories/rules and
Account appearance controls, plus Elegant light/dark and Cozy/Vibrant dark
surfaces. Real phones, installed PWA, every locale and the complete
palette/role/viewport matrix were not visually exercised. No production settings
were changed; local preview preferences were restored to Elegant/Light.
