# Transactions

The desktop Transactions table is month-aware for normal browsing and
history-wide for search and backlog review.

## Scope rules

- With an empty search box, `All`, `Expenses`, and `Income` follow the selected
  month in the page header.
- Any non-empty merchant/category search spans the full transaction history
  currently loaded in the client store, regardless of the selected month.
- Active text-search results show month, day, and year on both web and mobile;
  ordinary month-scoped transaction rows keep the shorter relative date.
- While search is active, the desktop month selector is disabled and reads
  `Searching all dates`; clearing the query restores month navigation.
- Desktop search is a compact 44px control. It shows an `All dates` scope badge
  and clear action while a query is active; `/` focuses it from outside an
  editable control, and `Escape` clears the current query.
- `Uncategorized` and `Excluded` are backlog-review filters and always span all
  loaded months, with or without a search query.
- Clearing the query returns an ordinary filter to the selected month.
- The Transactions footer total uses the same budget/reporting scope as Budget
  and Trends: rows marked **Exclude from budget** remain visible in the table
  but are omitted from that total. When present in the current result set, the
  footer states how many rows are excluded.
- Selecting a category highlights the Category table header in terracotta so
  the active filter is visually tied to the affected column.
- On desktop, category filtering lives in a dedicated left column beside the
  transaction workspace. Its counts reflect the active month/search and type
  scope; the transaction table occupies the right column. The former category
  dropdown is intentionally removed so category choices stay visible. Users
  can collapse the category rail to a compact reopen control when they want
  more table width; the active category remains applied and is indicated with
  the terracotta active treatment while the rail is collapsed.
- Every desktop table row has a trailing actions menu: **Edit**, **Exclude from
  budget**, and **Delete**. Exclusion is reversible from the edit form; Delete
  always asks for confirmation before permanently removing the transaction.
- When the **Income** type is active, that same desktop rail switches to
  **Income sources** instead of showing inapplicable expense categories. It
  supports All income sources, each saved source, and Unassigned income; the
  table's category column is relabeled Income source for the same scope.
- Individual desktop expense rows expose an inline category picker. Income rows
  use that same cell for an inline **Income source** picker instead; income has
  no expense category, and the picker updates only the selected transaction.
- Accounts that do not yet have any income sources receive a single **Main
  paycheck** source when their summary first loads. This safely provisions new
  and pre-income-source accounts without retroactively assigning a source to
  historical income transactions.

Filtering stays client-side through [`src/lib/search.ts`](../src/lib/search.ts).
The API currently caps the loaded working set, so “all history” here means the
transactions present in that working set rather than an unbounded database
query.

## Reimbursements

A **Reimbursement** is positive money returned for an earlier expense, not
earned income. Change an incoming e-transfer to Reimbursement in its edit form,
then select the category it repays. For example, a `$300` Grocery expense and a
`+$100` Grocery reimbursement produce `$200` net Grocery spending. Reimbursements
are excluded from Income filters and income totals, while reducing the matching
category, budget, and Trends spending total. They are deliberately individual
transactions: the editor never creates a merchant-wide categorization rule from
a reimbursement. The Transactions filters offer a dedicated **Reimbursements**
view immediately after Income; reimbursements are excluded from both Income and
Expenses filtering so each view represents one financial activity type.

## Advanced filters and saved views

The web Transactions toolbar and mobile Search support the same advanced
dimensions: inclusive date bounds, amount-magnitude bounds in dollars, and an
OR selection of category IDs. A date range takes precedence over the selected
month; empty advanced fields preserve the normal month-scoped behavior.

Saved views are named server-side records containing the type, category,
query, date, amount, and sort filters. The API sanitizes persisted JSON so
unknown keys and malformed values are ignored when a view is recalled.

## Bulk actions

Desktop table checkboxes and mobile Select mode support bulk categorization,
budget exclusion, and deletion. **Exclude from budget** preserves the original
transaction and category but removes the selected rows from budget and cash-flow
totals; it is reversible from that transaction’s edit screen. The bulk endpoint
is authenticated and scopes every selected ID to the current user.

On mobile, transaction filters wrap so every option remains visible without a
clipped horizontal rail. Select mode uses a stacked action panel: selection
controls first, income-source assignment only when at least one income row is
selected, then full-width exclusion/deletion actions. Controls retain 44px touch
targets, and the transaction list keeps enough bottom clearance to scroll above
the pinned Add transaction and tab-bar region.

On desktop, selection opens a compact contextual toolbar. Category and income
source menus apply a chosen value immediately—there are no separate Apply
buttons. Mixed selections remain type-safe: categories affect selected expense
rows, while the source menu states exactly how many income rows it will affect
and how many expenses it skips. Exclude remains a direct action; More contains
Include in budget (when selected rows are excluded) and a two-step Delete
confirmation. Each operation owns its loading/error state and reports its
result in the toolbar before the user clears the selection.

Merchant categorization rules are managed from Settings. Manual rules are
authoritative over AI/import rules, and a new rule can optionally be applied
to matching non-excluded expense transactions immediately. Deleting a rule
does not change existing transaction categories.
