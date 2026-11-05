# Settings investigation plan

Status: implemented locally. See [settings layout](../docs/settings-layout.md) for the final behavior.
Reviewed November 4, 2026.

## Evidence and limits

Reviewed production in Chrome: Personal Settings and an existing owner's Group
Settings at desktop width and in DevTools Responsive mode at 400 × 645 CSS
pixels. Inspected screenshots, accessibility structure, page scrolling, and
local component sources. No settings, memberships, records or permissions were
changed. Production review used the active light appearance; other palettes,
dark mode, real touch devices, member-only and archived groups remain untested.

The local preview initially displayed a shared navigation React rendering error
and a SelectionControl prop warning. Other uncommitted UI work appeared during
the investigation; preserve it and re-read affected files before implementation.
Production is the visual evidence; local sources explain structure but may differ
from the deployed revision. Develop was pulled with fast-forward-only and was
already current before this note was added.

## Current composition

| Surface | Current organization | Consequence |
| --- | --- | --- |
| Personal desktop | One full-width stack starting with the complete category tree | Category names and edit actions are far apart; all other settings sit below a very long list |
| Personal mobile | Same full category tree, then highlight preference, learning, connected apps, rules, businesses, install, updates and logout | First screen exposes only categories; other destinations require extensive scrolling |
| Group desktop | Full-width create/join panel; two-column grid of group details, members, install, updates, notifications, rules, categories and activity; management below | Secondary utilities precede ledger configuration; categories and history create very tall grid rows |
| Group mobile | Above sections collapse into one sequence, with activity initially limited to ten events | Create/join consumes prime space; categories/rules come after several unrelated cards |

Source entry points:

- `src/components/settings/PersonalSettings.tsx`, with responsive wrappers in
  `src/components/{web/views,mobile/screens}/Settings.tsx`.
- `src/components/groups/GroupSettings.tsx` and `GroupApp.tsx`.
- `src/components/settings/AccountSettings.tsx` and `account-sections.ts`.
- `src/components/shared/CategorySettingsList.tsx`.
- `src/components/settings/{RulesPanel,BusinessesPanel,ConnectedApps}.tsx`.
- `src/components/groups/GroupActivityHistory.tsx`.

## Main findings

1. **No short settings index.** Both ledgers immediately expose large management
   interfaces. Category trees dominate Personal; creation and app utilities lead
   Group. Users cannot quickly scan the available destinations.
2. **Different order for common tasks.** Categories lead Personal but sit well
   below rules and utilities in Group. Common functions need the same labels and
   relative placement, while each ledger retains its own data and permissions.
3. **Settings scopes are mixed.** Account already contains Profile, Security,
   Appearance/language and Notifications. Group repeats that same notification
   component; both ledger pages repeat Log out. Edited highlighting is one
   device preference in the shared store, despite appearing in ledger settings.
   Connected-app tokens belong to a user, but the capture workflow targets
   Personal; moving it must preserve explicit capture scope.
4. **Desktop width has little structure.** Personal rows span the available
   content width. Group uses a generic equal-column grid for tasks with very
   different sizes, and activity can render the latest 100 events at once.
5. **Mobile forms need focused space.** Personal rules show two explanation
   blocks before the form, narrow merchant/category fields and a nested list
   scroller. Businesses places icon, color, name and Add on one line and loses
   its desktop card wrapper. These patterns break the surrounding rhythm.
6. **Control consistency needs verification.** Edited highlighting renders a
   checkbox-shaped switch rather than the shared Toggle. Personal rules specify
   38px Add and 32px delete controls; connected apps specifies 40px create
   controls. These are source-level touch-target concerns, not measured
   production hit-box results.
7. **Responsive surface treatment differs visibly.** In the inspected light
   appearance, Group's large desktop peach/yellow panels become mostly white
   cards on mobile. Preserve theme tokens and existing shapes, but review this
   styling alongside a shared settings hierarchy.

## Recommended direction

Use a shared settings information structure with ledger-specific entries.
Desktop gets a compact section navigation column and one bounded content area.
Mobile starts with grouped destination rows, each opening one focused section
with a clear Back to settings action. Both layouts use the same section names
and ordering. This is a proposed interaction change for both desktop and mobile,
as explicitly requested in the investigation brief.

| Area | Personal | Group |
| --- | --- | --- |
| Ledger configuration | Categories; Categorization rules; Businesses | Group details; Members & invitations; Categories; Categorization rules |
| Group history | — | Activity |
| Help & app | Learning; Install when available; What's new | Install when available; What's new |
| Group management | — | Archive/reopen; Leave group; secondary Create/join group actions |

Keep global Account access in the existing desktop Account menu and mobile
avatar. Prefer a single home there for Notifications, device display preferences
and Log out. A contextual link can open Notifications without duplicating the
form. Keep connected apps explicitly labeled as Personal capture; decide its
final entry point before moving it, since user ownership alone does not imply
group capture support. Do not invent unsupported Group businesses or learning
flows simply to fill matching slots.

Categories should open their own workspace with search and collapsible parent
groups, retaining Add/Organize and existing editors. Rules should have a short
description, optional detailed help, a clear Add action, and a readable list;
stack fields on phones and avoid a second scrolling region where practical.
Activity should use a bounded initial page on desktop as well as mobile.
Group details and membership actions retain current owner/member/archive gates.

## Implementation sequence and review criteria

1. Reconcile ongoing shared-navigation work and confirm current sources. Build
   the shared section shell using existing navigation primitives, with section
   selection represented in the URL where compatible with current routing.
   Preserve onboarding's Settings → connected-apps anchor/deep link.
2. Place existing panels into sections before changing their internals. Preserve
   drafts, focus return, scroll position and busy-operation navigation guards;
   section navigation must never submit a form or repeat API mutations.
3. Refine category/rule lists and mobile forms; group secondary utilities and
   management actions. Keep form save boundaries explicit; avoid a page-wide
   Save because settings have independent persistence behavior.
4. Document the implemented structure under `docs/`. Test meaningful navigation,
   scope and permission behavior. Verify production CSS and visual rendering at
   320/375/400px, 1024px and wide desktop, all three palettes and light/dark,
   long translations, empty/large lists, installed/browser PWA states, owner,
   member and archived groups. Include keyboard navigation, focus, 44px touch
   targets, bottom-bar clearance and draft preservation on viewport changes.

Acceptance: every top-level destination is discoverable without scrolling
through a category list; common tasks retain the same names/order across
ledgers; long lists cannot bury unrelated settings; account/device versus ledger
scope is explicit. Preserve accounting, API contracts, existing confirmations,
semantic colors, theme-specific shapes and data ownership.
