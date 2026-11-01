# Personal and Group control parity

The Personal/Group alignment applies to both mobile and desktop, in Cozy and
Vibrant. Identical functions should share names, control geometry and placement.
Existing corner radii, borders and palette tokens remain presentation choices;
ledger permissions and accounting rules remain separate.

## Shared implementations

- Mobile navigation uses `shared/ledger-navigation.ts` for the five common slots:
  Home, Transactions, Budget, Trends, Goals. Both use 44px minimum targets, 18px
  icons and the same label sizes. Group Bills, Import and Settings remain
  accessible from More; settlement and group administration stay secondary.
- Desktop group navigation follows the same common sequence as Personal. Its
  group picker and group-only administration follow the common navigation, so
  extra tools do not shift the common destinations.
- Both headers use `QuickAddButton`; phones show its icon and desktop shows its
  translated Add transaction label. The Group header uses the shared 64px desktop
  height and common page gutters. Month selection uses `ReportDateControl` and
  `MonthSelector`, with the owning ledger retaining its own reporting state.
- Goals and Bills reuse the same workspace and editors in both ledgers on both
  screen sizes. Personal mobile wrappers supply their shell title/gutters and
  retain their existing creation-button corner treatment. The scoped
  `LedgerFeatureContext` ensures Group operations never call Personal mutations.
- Ordinary Group dialogs use the same 400px default as Personal; category
  editors use 440px. Shared Modal supplies close placement, focus handling,
  viewport limits and inner spacing. Group-specific repayment/split workspaces
  retain their explicit widths.
- Dropdown options already share Select, its list layout and keyboard behavior.
  Import review/confirmation, calendars, goal forms and recurring forms reuse
  shared controls rather than introducing Group variants.
- AI categorization uses the same translated button label and 44px target.
  Import entry labels use the checklist catalog in both ledgers. Common bulk
  actions use the Transactions catalog for selection count, category assignment,
  deletion, selecting and clearing selection. Transaction forms share Save /
  Save changes / Saving labels and place the primary save action on the right.

## Ledger-specific areas awaiting product review

These remain reachable in their existing logical workspaces; alignment does not
turn them into shared features:

| Area | Distinct controls retained |
| --- | --- |
| Group navigation | Group picker, manage groups, settlement |
| Group transaction editor | Payer, shared funds, member splits, linked refunds, audit reason, void |
| Group transaction tools | Copy to another group, change date, version-aware selection and review |
| Group Budget | Monthly pool, allocations, copy previous month |
| Group Settings | Membership, permissions, archive/leave, category organization and split rules |
| Group import | Destination, payer and member-balance defaults |
| Personal tools | Voice capture, income sources, budget exclusion, saved views and personal account integrations |
| Reports | Personal report periods/cash flow and Group payer/settlement analysis |

“Void” and “Delete” deliberately retain their distinct names because their
accounting/audit behavior differs. Matching labels never imply matching data
scope, bulk limits, confirmation requirements or permissions.

## Week-first records and scroll-aware entry action

Everyday Calendar starts in Week in both ledgers and on both device layouts;
Month remains available from its view switch. Calendar records include the
optional note, displayed with category (and reporting date where relevant) on a
single truncated metadata line. `RecordSummary` keeps this treatment shared with
transaction cards and Group ledger rows. Full details remain in existing editors.

Lists alternate 5% and 12% primary/card color mixtures, keeping colors tied to the
current palette and light/dark/context tokens. Selection and recently edited
highlights win over stripes. Desktop transaction windows use absolute row parity
so virtualization cannot flip the alternating backgrounds while scrolling; their
48px row height is shared by the spacer and rendered rows.

Home and Transactions use `ScrollRecordAction`: a centered, wider Add record
button initially, replaced by a bottom-right calendar-styled action after its
anchor leaves the viewport. Desktop's independently scrolling Transactions rows
also trigger this state. Returning to the top restores the wide action. Mobile
floats clear the tab bar and safe area; desktop floats use the bottom-right
content edge. Calendar button color and corner shape remain palette-specific.
The existing Personal or Group composer opens without introducing a new mutation
path. Other pages retain their header entry points.
