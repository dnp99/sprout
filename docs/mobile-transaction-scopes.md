# Mobile transaction scopes

Transactions starts in All and uses a top-level All / Expenses / Income segmented
control matching Week/Month. It supports tapping, horizontal swipes and left/right
arrow keys. Vertical scrolling never changes scope. Personal and Group share the
same control; desktop keeps its existing navigation and filters.

## Personal

`mobileTxnScope` is a UI-only store value, initially `all`, independent of desktop
transaction-type state. `filterScopedTransactions` first restricts to that scope,
then applies secondary type, category, month/date, query and amount constraints.
Mobile Search retains the chosen primary scope and secondary type. Sort and bulk
actions operate on the resulting list; changing primary/secondary filters clears
bulk selection so hidden rows cannot be mutated accidentally.

Reimbursement, Uncategorized and Excluded remain secondary chips. Tapping an
active chip again clears it. Uncategorized is not offered in Income; reimbursements
remain in All under their existing distinct money classification rather than
being reclassified as earned income or spending. Income offers an income-source
selector instead of expense categories. Changing the primary scope clears its
secondary type/category/source selection. Financial monthly summaries retain
their existing accounting definitions.

## Group

Group combines the selected kind with its existing payer, query and date scope.
The optional validated `kind` query parameter (`expense` or `income`) filters the
complete authorized ledger before pagination, counting and match-based bulk
selection. Omitted/All kind preserves the existing request and server behavior.
Refund records remain visible in All with their existing separate semantics.

The responsive Group shell strips the mobile-only kind from effective filters on
desktop, including after resize, so the desktop ledger never inherits an invisible
mobile filter. Switching back to mobile restores its chosen scope. Group changes
retain the existing group-id isolation; scope defaults to All for another group.
No schema or monetary calculations change.
