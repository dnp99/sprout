# Split & Settle category percentage rules

Requested 2026-10-28, with user clarifications incorporated. Implemented locally; verification is tracked below. Extends the
explicit splitting and one-level subcategory work in 023-together-fusion.md.

## Requested behavior

- Move the percentage/default editor from Group Settings into Split & Settle.
- Select an inclusive date range, including a partial month or cross-month span.
- Persist group-wide member percentages and explicit category overrides on the
  server, restoring saved settings when reopening the workspace.
- New two-member groups default to 50/50; larger groups default to equal shares.
  Preserve existing valid custom defaults rather than resetting them.
- Resolve each record's rule from explicit child override, then explicit parent
  override, then group baseline. A child with no override follows subsequent
  parent changes; never materialize inherited values as explicit overrides.
- Support 0% shares, including 100/0. Validate active-member coverage and a total
  of 100% with integer basis points, using existing cent-conserving allocation.
- Add one level of group subcategories; current group categories are flat.

## Proposed interaction

1. Choose a custom date range (both endpoints included), calendar month(s), or
   week(s). Month choices include explicit year, e.g. September or October 2026.
   Keep nonadjacent selected months as separate ranges rather than including the
   intervening dates. Weekly options use the app's calendar week convention and
   show start/end dates so the actual selection is unambiguous.
2. Display proportions on the left on desktop: group baseline first, followed
   only by category exceptions. Do not display inheritance-source labels.
   If all parents follow a 40/60 baseline, show no parent rows except deviations
   such as a 50/50 category. If Grocery is 50/50 and its Food/Drink children are
   also 50/50, show Grocery once. Show a child only when its effective ratio
   differs from its parent's effective ratio. Never hide a child exception just
   because its value happens to equal the group baseline. Keep every category
   accessible through the editor even when omitted from the compact summary.
   On mobile, place this same compact rule panel above the calculations.
3. Preview affected record count, spending, member allocations and net transfers.
4. Every Split recalculates all selected eligible records, whether or not they
   were previously split. Replace their previous calculation results; preserve
   results for records outside the selection. Overlapping ranges must never
   duplicate a record's calculation or accumulate previous shares.
5. Show a small accessible split icon next to each calculated record. The badge
   is derived from separate calculation state, not by modifying the original
   transaction. Keep any internal audit history out of the current result sum.

Provide Reset to inherited on each category, a two-member complement input, and
an explicit Save as defaults action. Retain the selected date range separately
from financial rules. All UI uses existing semantic tokens and translations.

## Accounting and persistence constraints

- Original records and their author/payer/amount/date remain unchanged by splitting.
- Existing actual repayments are preserved. A date-filtered preview must clearly
  distinguish period allocations from all-time net obligations.
- Linked refunds retain the original split and cumulative refund caps. Income,
  shared funds and standalone refunds require the existing fusion accounting
  decisions rather than blindly treating every signed amount as an expense.
- Recalculation uses the current selected rules, replacing previous split
  percentages/results for selected records. Do not preserve old allocation
  overrides in a way that prevents the requested fresh calculation.
- Membership changes invalidate incompatible explicit rules; do not silently
  redistribute former-member historical allocations.
- Server validates group/category/member ownership, date bounds, permissions,
  integer weights, hierarchy depth, and concurrent revision changes.
- Persist applied allocations as snapshots with audit history. Later default or
  category changes do not mutate historical results without explicit application.
- Use generated Drizzle migrations only, update ER/system docs, and verify rule
  inheritance, zero shares, rounding, date boundaries, refunds, repeat application,
  concurrency, permissions and preservation of repayments.

## Confirmed calculation semantics

Split is a calculation only: it never rewrites original ledger records. Each
application replaces the latest split result for the selected records, rather
than appending additional debt. The calculated badge indicates a saved split
result. A later change to an original record must flag the saved calculation as
stale rather than silently treating the old result as current (fusion requirement).
Actual repayments remain independent and are never overwritten by recalculation.

## Optional recalculation after edits (latest user clarification)

This supersedes the earlier mandatory-sounding “Needs recalculation” badge:
recalculation is always optional. An edit never invalidates or deletes the saved
split result and never blocks editing or splitting other records.

- When editing an already split amount, offer “Include this edit in the next
  split” (将本次编辑计入下次分账). Track this decision separately from the original
  record and saved split result. Category changes also remain reviewable because
  they may change the applicable rule.
- An opted-in edit has a non-blocking review badge. At the next Split involving
  this record, list it for review with the old calculation and current edited
  values, and require an explicit include/exclude decision before applying the
  selected batch. The user may proceed with either decision.
- Include: recalculate using current record values and current rules, replace
  the saved split result, and clear this edit's pending review state.
- Exclude: keep the previous split result and acknowledge this edit as excluded.
  Do not remind again or automatically select this edited version in later
  splits. Ordinary range recalculation must respect this explicit exclusion.
- The edit-form opt-out likewise keeps the previous result and does not queue
  this edit for later split review. Never silently replace the old calculation.
- Scope acknowledgement to the financial edit revision: a subsequent amount or
  category change is a new decision, rather than permanently excluding the
  transaction. Retain a manual way to include an excluded record in a later
  recalculation; it must be an explicit action, not automatic range selection.
- Do not label an acknowledged old result as calculated from the current edited
  values. Details can distinguish the saved split snapshot from the current
  original without repeatedly showing a recalculation warning.

Persist pending/acknowledged review state on the server across sessions. Apply
review decisions and allocation replacement atomically with revision checks so
a concurrent edit cannot be accidentally acknowledged or recalculated. Test
include, exclude, repeated range splits, later edits, and unchanged repayments.


## Implementation status

Implemented the independent calculation workspace, category hierarchy/rules,
period selection, optional revision-scoped edit review, and legacy compatibility.
Also added central header calendar navigation and a default-on, persistent
three-day edit-highlight toggle as requested during implementation. Current
system behavior is documented in docs/split-and-settle.md. No push/deploy is
included in this work.
