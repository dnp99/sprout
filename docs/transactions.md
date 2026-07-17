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
- Selecting a category highlights the Category table header in terracotta so
  the active filter is visually tied to the affected column.
- On desktop, category filtering lives in a dedicated left column beside the
  transaction workspace. Its counts reflect the active month/search and type
  scope; the transaction table occupies the right column. The former category
  dropdown is intentionally removed so category choices stay visible. Users
  can collapse the category rail to a compact reopen control when they want
  more table width; the active category remains applied and is indicated with
  the terracotta active treatment while the rail is collapsed.

Filtering stays client-side through [`src/lib/search.ts`](../src/lib/search.ts).
The API currently caps the loaded working set, so “all history” here means the
transactions present in that working set rather than an unbounded database
query.
