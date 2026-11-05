# Split & settle — investigation and UI/UX proposal

Status: investigation complete; UI/UX proposal for review. Implementation is not
authorized and has not started. Updating this plan is documentation-only.
Reviewed November 5, 2026. Scope: desktop and mobile, as explicitly requested.

## Evidence and limits

Reviewed the supplied desktop screenshot and the existing local Chrome session,
including desktop scrolling, responsive layouts at 320 × 650 and 390 × 650 CSS
pixels, the record list, disabled review state, and empty Payments view. Read
the workspace, rules, period picker, repayment dialogs/history, group shell,
accounting, repository, split operations and existing tests. No ledger records,
rules, repayments, memberships or appearance preferences were saved or changed.

Develop was updated with fast-forward-only and was already current. Existing
untracked mobile/PWA work was preserved. This report describes the inspected
local sources, not a verified production deployment.
Additional unrelated mobile/PWA edits appeared during the investigation. They
were left untouched; re-read the shared group shell and modal/navigation hooks
before implementing this plan because concurrent work may change those areas.

The live group had 28 new candidate records, no saved balance, a disabled Record
repayment action, and a calculation eligibility error. Successful live split
preview/apply and repayment recording were therefore not exercised. Their
behavior was reviewed in source and existing automated tests. Other palettes,
dark mode, French, real touch devices, installed PWA, archived groups and
multi-member live payment flows remain unverified visually.

## Current flow and constraints

- Transactions opens the settlements route; Back to transactions returns there.
- The balance summary and suggested transfers cover saved calculations and
  repayments across all dates. They do not represent all unsplit expenses.
- Split expenses and Payments share a persistent balance summary. Both views
  stay mounted, preserving split choices when switching between them.
- Split rules is collapsed. The calculator independently selects months,
  Monday–Sunday weeks or an inclusive custom range, then expands linked refund
  families, including records outside the selected dates.
- New and current records default to Include. Pending edits require a choice;
  excluded edits default to keeping the previous result. Applying replaces saved
  calculations, while preserving originals and actual payments.
- Review shows selected shares and projected all-time transfers in a dialog;
  applying is a separate explicit action. Repayment suggestions open drafts and
  never move money. Reversals retain history and require a reason.

Keep integer cents, deterministic refund allocation, family-level decisions,
server authorization, version/revision checks, idempotency and duplicate-payment
acknowledgement. This investigation does not propose schema or accounting changes.

Source map:

| Responsibility | Source |
| --- | --- |
| Route, header month, workspace mounting | `src/components/groups/GroupApp.tsx`, `GroupHeaderReportControls.tsx` |
| Views and saved balances | `src/components/groups/GroupSettlements.tsx`, `SettlementBalances.tsx` |
| Rules, dates and record decisions | `src/components/groups/GroupSplitWorkspace.tsx`, `GroupSplitSettings.tsx`, `SplitPeriodPicker.tsx` |
| Payment drafts/history | `src/components/groups/RepaymentDialog.tsx`, `RepaymentHistory.tsx` |
| Responsive dialogs | `src/components/groups/ui.tsx`, `src/components/ui/overlays.tsx` |
| Calculation and family eligibility | `src/lib/groups/split.ts`, `split-range.ts`, `split-operations.ts` |
| Saved balances and payment validation | `src/lib/groups/accounting.ts`, `repository.ts`, `operations.ts` |

## Findings

### P1: Eligibility can admit a family that blocks the entire preview

Observed live: Review split displays 28 included but is disabled, with the generic
error “Choose eligible member-paid expenses.” The list does not identify the
responsible record or offer a direct repair/skip action.

Independently reproduced with fictional in-memory data: an unsplit shared-fund
expense (`payerId: null`) is ineligible, but its linked member-paid refund is
eligible according to `splitEligible`. Selecting that refund expands the family
to include the expense. `calculateSplit` then rejects the expense with the same
error. This demonstrates a source-level failure path; it does not establish that
this exact family caused the inspected group's error.

Resolve candidate eligibility at the family level, consistently with the server.
Distinguish an uncalculated shared-fund family from a previously calculated
expense changed to shared funds: the latter must remain reviewable so an explicit
recalculation can remove its old obligation. Show record-specific blockers and
an explicit family Skip/Keep previous action; never silently lose debt.

### P1: Sticky review obscures its own error on mobile

At 390 × 650, the review bar partially covers the eligibility error immediately
above it. Its disabled state supplies no explanation in the bar. Long lists make
the separate error easy to miss. Keep blocking feedback visible beside the
action, reserve space for it, and provide a jump to the affected family/rules.
The review bar already clears bottom navigation in this inspected viewport;
preserve that clearance while fixing overlap with content.

### P1: Settled headline implies more completeness than the data supports

The live screen simultaneously says “You’re settled up” and has 28 New records.
The caveat is correct but subordinate. The empty balance state also repeats
“All balances are settled.” A personal zero balance is distinct from the whole
group being settled, and both are distinct from every expense being split.

Use a qualified saved-balance label, plus a prominent unsplit/needs-review count
and direct Review records action. Scope those counts explicitly: all-time counts
in the balance area, selected-period counts in the calculator. Avoid treating
previously excluded edits as unresolved review work.

### P1: Two date controls create surprising draft resets

The header month and calculator ranges are separate states. Changing the header
month remounts `GroupSettlements` through its `${id}:${month}` key, resetting the
active view, rule editor, ranges, record choices and any open repayment draft.
Changing calculator ranges or receiving a new group revision also remounts
`SplitCalculation`, resetting choices, filters and preview state.

Give the split workspace one explicit period owner; label balance/history as
All time. Prefer removing the duplicate month selector on this route and retaining
the shared picker within Split expenses. Keep draft decisions by record/version,
preserve them across view switches and compatible period changes, and invalidate
changed versions deliberately on refresh. Do not carry stale preview approval
through a revision conflict. Warn before discarding an edited payment/rule draft.

### P2: Desktop width does not help with the task

The balance card, rules disclosure, period controls and records form one wide
vertical stack. The supplied screenshot shows only the beginning of the calculator
at the bottom; desktop rows still use the same tall per-record select as mobile.
An empty transfer grid adds spacing before another settled message.

Use a compact balance header. On wide screens, place the record workspace beside
a narrower period/rules/selection summary. Align merchant, date/category, payer,
amount and decision so more records can be compared without increasing density
by shrinking typography. Collapse to one column below the desktop breakpoint.

### P2: Mobile reaches the task too late and rows are expensive to scan

At 320px, navigation, a wrapped title/date row, Back to transactions and the
balance card consume the initial viewport; Split expenses/Payments and calculator
controls are below it. At 390px, each record uses a full-width decision dropdown,
and rows omit payer information. There is no merchant search or payer/category
filter in this workspace. Linked families are synchronized but presented as
independent rows with only generic explanatory text.

Keep a short balance summary and visible workspace switch before optional
details. Use compact record cards with payer, clear status and visible family
relationships. A simple Include/Skip control can serve new records, while changed
records retain explicit Include/Keep previous choices and a before/after comparison
of changed money, payer, date and category. Search/filter work should preserve
existing bulk semantics: actions apply to shown families; preview applies to the
whole selected set. Keep the included count visible when filters hide selections.

### P2: Repayment form asks for too much and explains too little

Record repayment is disabled in the inspected group without an adjacent reason;
the source disables it when fewer than two member rows exist. The form always
shows the audit-reason input although the server requires it only for recording
between other people or involving former members. Both participant selects allow
the same person, with a disabled submit as the only immediate feedback. Former
member status is omitted from their option labels. History has no search/filter
or paging and renders every repayment.

Explain unavailable actions, label former members, prevent or explain identical
participants, and show/require the reason only when the server requires it.
Retain editable partial amounts, suggested defaults, duplicate acknowledgement,
failure drafts and reversal confirmation. Keep the “records a payment already
made; does not move money” explanation near submission. Provide history filters
and bounded rendering for long histories if usage warrants it.

### P2: Shared presentation conventions need alignment

All/Changed/New/Calculated use local pressed buttons with a soft fill, rather
than the shared filled selection foundation. Month checkboxes are native and
visibly blue in the inspected appearance. Use existing shared primitives and
semantic primary/on-primary tokens; retain 44px targets, keyboard focus, complete
translated labels and current theme-specific shapes. Rules currently nests a
Panel within its disclosure card; flatten that redundant surface during layout
work, without changing rule inheritance or save boundaries.

## Proposed UI/UX direction

This section expands the investigation into a reviewable design proposal. It is
proposed behavior, not a description of shipped functionality. The goal is to
answer three questions immediately: **What is my saved balance? What still needs
splitting? What can I do next?** Keep the same tasks, wording and financial
meaning on mobile and desktop; adapt the arrangement to the available space.

### Information hierarchy and visual treatment

1. A small Back to transactions link and the page title establish location.
   Remove the unrelated month selector from this route's header; the split
   period belongs inside Split expenses. Keep the existing account/context and
   bottom-navigation structure; broader shell changes are outside this plan.
2. A compact balance summary shows **Your saved balance · All dates**, the amount
   owed/owing or a qualified zero-balance message, and an attention count. Avoid
   repeating a second settled message or reserving an empty suggestions area.
3. Split expenses / Payments follows immediately. These are separate tasks;
   the switch must remain discoverable before long lists or optional details.
4. The active workspace contains the period, records and review action, or
   suggested repayments and actual-payment history. Member balances, detailed
   help and rule editing are secondary disclosures.

Use existing neutral card surfaces and hairline borders. Reserve primary fill
for the main action and selected controls, rather than a large decorative
summary panel. Keep the existing radius/shape roles for each appearance, Geist
typography, restrained weights and tabular money. Reuse semantic tokens across
Cozy, Elegant and Vibrant, light and dark; no new palette or theme-specific
layout. Use short Lucide cues only when they improve scanning. Changes in status
must include text, not rely on color or an unfamiliar badge alone.

### Desktop composition

The record list is the main work area, with a narrower supporting column. Use
approximately two-thirds/one-third of available width, with the supporting
column around 280–320px where space permits. Fall back to the single-column
arrangement whenever either column would compress controls or truncate money.
Do not force two columns solely because a viewport crossed 1024px.

```text
Back to transactions
Split & settle
┌──────────────────────────────────────────────────────────────────┐
│ Your saved balance · All dates        8 records need attention    │
│ You owe $42.50                        Review records →            │
│ Member balances ▾                                                │
└──────────────────────────────────────────────────────────────────┘
  [ Split expenses ] [ Payments ]
┌──────────────────────────────────────┐ ┌─────────────────────────┐
│ Records                 Search       │ │ Split period            │
│ All / New / Needs review / Calculated │ │ Month / Week / Custom   │
│ Shown-record actions                 │ │ Selected dates          │
│                                      │ │                         │
│ Merchant · category    Paid by Amount │ │ Split rules ▾           │
│ Compact selectable records           │ │ Default + exceptions    │
│ Changed record: old → new + decision  │ │                         │
│ Linked expense/refund relationship   │ │ Selection summary       │
│                                      │ │ 6 included · 2 to review│
└──────────────────────────────────────┘ └─────────────────────────┘
  Visible blocker + next step, or [ Review split · 6 included ]
```

This is a hierarchy sketch, not final dimensions or literal combined toolbar
text. Use a readable merchant column, aligned money, and payer/date/category
metadata. Normal rows should not require a full-width dropdown underneath.
Expand only records that need a comparison or decision. Avoid a second nested
vertical scroller; let the workspace use the existing page scroll container.
Keep the selection total and Review action accessible while scrolling without
covering the final row, a focused control or error text.

In Payments, use the main column for history and the supporting column for
suggested repayments and Record repayment. Keep the amount, sender, recipient
and payment status easy to compare. With no suggestions, use a short explanation
instead of an empty card. The primary action in this view is Record repayment;
the Split expenses view gives primary emphasis to Review split.

### Mobile composition

Use one column with compact context before the task. The initial viewport should
expose the workspace switch and the start of period/record controls at ordinary
text size on a typical 390px phone. At 320px or enlarged text, allow natural
wrapping and scrolling; never shrink text or hit areas to meet a fold target.

```text
‹ Transactions
Split & settle
┌──────────────────────────────┐
│ Saved balance · All dates    │
│ You owe $42.50               │
│ 8 records need attention →   │
│ Member balances ▾            │
└──────────────────────────────┘
  [ Split expenses | Payments ]
  Period · November 2026   Edit
  Split rules ▾
  Search records
  All / New / Needs review …
┌──────────────────────────────┐
│ □ Groceries          −$60.00 │
│ Nov 4 · Food · Paid by Alex  │
│ Linked refund · View family │
└──────────────────────────────┘
  More records …
┌──────────────────────────────┐
│ 6 included · 2 need review   │
│ Review changed records →     │
│ [ Review split ]            │
└──────────────────────────────┘
  Existing bottom navigation
```

Prefer a one-line period summary opening a focused period editor. Start with
the incoming transaction month, then explicitly confirm date changes. Show the
full selected range or “3 months selected,” with exact dates available on open.
Use the same month/week/custom capabilities as desktop; do not force mobile
users through a reduced calculator. Keep the rules disclosure compact, showing
a short default-share summary before its editor when space permits.

The review footer owns both its action and blocking explanation. Reserve its
full height in the content, including multiline errors and safe areas. With the
keyboard open, keep the focused input visible and avoid stacking the review bar
over it. A disabled button must have readable nearby guidance and an enabled
action to resolve the blocker. Respect reduced motion and existing PWA back
handling; opening or closing an editor must return to the prior list position.

### Record selection and review interactions

| Situation | Proposed presentation and behavior |
| --- | --- |
| New record | Themed inclusion checkbox, amount, merchant, category/date and payer; New label. Default inclusion remains unchanged. |
| Current calculation | Same compact inclusion control with Calculated status. Excluding means retain the saved result, not remove debt. Explain that distinction in selection help. |
| Pending financial edit | Needs review label and an expanded comparison of changed amount, category, payer or date. Require Include update or Keep previous; no preselected resolution. |
| Previously kept edit | Kept previous label, accessible through filters, with the old result and an explicit Include update action. Do not count it as unresolved or repeatedly remind. |
| Linked refund family | Show which expense the refund belongs to, disclose cross-period rows, and make it clear that selecting any member changes the family. View family reveals all affected records. |
| Eligibility/percentage error | Identify the affected record/family or rules, explain the problem, and offer a direct path to repair or keep/skip where permitted. Never silently drop saved obligations. |

Search merchant/note text, with payer/category filtering available through a
secondary filter control. Counts must distinguish records in the selected dates,
extra linked records and total included records. New and Needs review are useful
separate filters; keep previously retained edits reachable without mixing them
into unresolved work. Reuse shared selection and themed checkbox components.

Bulk actions operate on **shown records and their linked families**; the footer
continues to show the complete included selection. Example: “6 included · 2
outside this filter.” Bulk exclusion uses separate explanatory copy for Skip new
and Keep previous, even if one command handles a mixed list. Never imply that
unchecking a calculated expense deletes its saved split. Where family expansion
affects hidden records, show the affected count before final application.

Review opens a focused preview with two clearly separated sections: **Shares
for selected records** and **Overall balance after applying · All dates**. Show
included, skipped and retained-result counts. Explain that applying saves the
calculation and does not record a repayment. Keep Back to records and Apply
split explicit; only Apply writes. After success, update balances/statuses and
show a concise success message. A failed apply retains decisions and identifies
what to resolve; a revision change invalidates approval of a stale preview.

### Balance wording, attention entry point and empty states

| State | Suggested wording / action |
| --- | --- |
| Zero saved balance with unsplit records | “No balance from saved splits” and “8 new records to split.” Review records opens a clearly labeled All dates attention scope. |
| Debt with pending edits | “You owe $42.50” and “2 updates need review.” Clarify that the amount is based on saved results. |
| No debt and nothing unresolved | “Your saved balance is settled.” Do not claim the entire group is settled unless every member's saved balance is zero. |
| No eligible records in selected dates | “No expenses to split in these dates.” Offer Change period and Back to transactions; explain that income/shared funds do not create member debt. |
| Search/filter finds nothing | “No records match these filters.” Offer Clear filters without resetting date or inclusion choices. |
| Single member | Explain why repayment is unavailable and link to the existing membership workspace if permitted. Do not gate splitting solely on the absence of a second member. |
| Archived group | Show a clear read-only notice and historical data; do not offer write actions. |
| Loading/failure | Keep the selected workspace and drafts; show loading feedback without flashing a settled state. Offer Retry for failed reads. |

The compact attention count covers eligible New records and pending edits across
all dates, not skipped shared-fund families or previously kept edits. Before
opening a broader period, make that scope change explicit and preserve the
previous date selection for returning to it. The current period's own counts
remain local to the record workspace. Example copy is a proposal and must be
localized across all supported message catalogs before implementation ships.

### Repayment and history experience

Suggested transfers show direction in words: “You owe Taylor $42.50,” with Record
repayment opening a prefilled, editable draft. Manual recording supports other
actual transfers and partial payments. Show From, To, Amount and Date first;
Note is optional. Exclude the selected sender from recipient choices, mark
former members, and display/require an audit reason only when existing server
rules require it. Do not silently swap payment direction after a selection.

On desktop, use the existing bounded dialog; on mobile, propose a focused
full-height editor with a stable title/close control and reachable submission.
Keep the same fields and validation on both. Near submission, state “Records a
payment already made. Sprout does not move money.” An exact matching payment
must be explained with its date, amount and participants before acknowledgement.
Errors retain amount, participants, note and reason. Closing a changed draft
requires a discard decision; opening a suggestion alone performs no write.

History shows amount and direction first, date/recorder second, and a visible
Recorded/Reversed status. Start with a bounded page and Show more, retaining
all history in the authorized dataset. Offer participant/status filtering for
long histories. Reverse payment opens the existing reason/confirmation flow;
explain its effect on balances and keep the original entry visibly reversed.
Do not replace reversal with deletion or add unsupported payment execution.

### State continuity and accessibility

Selections and rule/payment drafts remain owned by the workspace, independently
of layout and active view. Resizing or switching Split expenses/Payments must not
discard them. Period/filter changes preserve compatible record decisions; edited
versions require a fresh decision, including linked-family changes. Group
switches and navigation away must respect existing discard guards. Persistence
across a full reload is not promised by this proposal and needs a separate
decision before storing sensitive financial drafts on the device.

Maintain keyboard access, named controls, visible focus and focus return from
editors. Announce changed selection counts and errors without moving focus on
ordinary filtering. Keep 44px targets, semantic text contrast and readable
amounts at enlarged text sizes. Allow shared segment tracks to scroll when
labels need space. The main page should not scroll horizontally at 320px, and
touch scrolling must not accidentally change inclusion or lose a draft.

### Design review before implementation

Use these sketches and proposed interactions as the basis for approval, not as
approval themselves. Before code changes, review the compact summary, desktop
two-column composition, mobile period editor/review footer, changed-record
comparison and repayment editor together. The suggested default is one shared
task structure with responsive placement, using Sprout's current design system.
Higher-fidelity mockups, if requested, remain separate from app implementation.

## Proposed implementation order — after explicit approval

1. Fix family eligibility and actionable validation feedback first. Add targeted
   regression coverage for shared-fund/refund families, retained old obligations,
   record-specific blockers and mobile error visibility.
2. Unify period ownership and draft lifecycle. Cover header/range changes, view
   switches, background revisions and conflicts before moving controls.
3. Build the compact balance summary and responsive workspace: desktop columns,
   mobile task-first stack, selected counts and changed-record comparisons.
4. Refine repayment validation and history. Preserve server permissions and all
   actual-payment confirmation/duplicate/reversal safeguards.
5. Update `docs/split-and-settle.md` to describe implemented behavior, then verify
   production CSS and rendered states across all three palettes and both modes.

## Verification

Existing targeted suite passed: 5 files, 29 tests covering settlement UI,
entry/rule flows, accounting and split calculations. Command:

```sh
npm run test -- src/components/groups/GroupSettlements.test.tsx src/components/groups/GroupSplits.test.tsx src/lib/groups/accounting.test.ts src/lib/groups/split.test.ts src/lib/groups/splits.test.ts
```

The family-eligibility reproduction ran the existing pure functions with fictional
data and performed no writes. No app implementation or new tests were added.
Database integration tests, full lint/test/build and successful live writes were
not run for this investigation.

Implementation acceptance should include 320/390px phones, 1024px and wide
desktop, enlarged text/French, keyboard/focus, browser/installed PWA and touch
keyboard, no records/unsplit-only/settled/debt states, active/former members,
archived groups, long histories and cross-period refund families. A blocked
Review must always identify what to fix, and neither a date change nor a view
switch should silently discard an unrelated draft.
