# Group Transactions

Group Transactions follows Personal’s responsive browsing hierarchy and shared semantic theme tokens. Desktop uses a collapsible category rail, toolbar, searchable table and totals footer. Mobile uses compact transaction cards, a selection bar and the existing floating Add action. Desktop Add transaction lives in the toolbar; Split & settle remains a secondary toolbar action.

## Filters and ordering

The default scope is the selected month. Searching switches to all dates; clearing search restores the month scope. Explicit date bounds continue to apply. Filters intersect transaction type (All, Expenses, Income, Refunds or Uncategorized), category, payer, date and absolute amount bounds. Group has no Personal Excluded flag. Amount bounds are parsed to integer cents before reaching the domain filter and validated again by the server.

Desktop exposes type chips and Paid by directly. Mobile exposes All, Expenses and Income; advanced filters contain Refunds, Uncategorized, Paid by, category, amount and sorting. Both use the shared date-scope controls. Sorting supports merchant, category, payer, date and signed amount. Category search and ordering use category labels; payer ordering uses member names.

The shared domain search applies filters and sorting before server pagination. When the authorized full reporting ledger is available, the client uses the same helper for immediate filtering, category counts and totals across all matching records, rather than only the visible page. Pages contain 50 records.

## Records and selection

Desktop columns are Merchant, Category, Paid by, Date and Amount, with checkboxes and a row action menu. Mobile cards retain category, payer, recorded time and amount. Split and edited badges remain alongside the merchant. Opening a record displays its details and shares; Edit and expense Refund are available from the details view and row menu. Archived groups remain read-only.

Desktop selection begins with table checkboxes; bulk controls appear inside the table header. Mobile Select enables checkboxes and a bulk action area. Selection carries record versions across pages, is capped at 200 records, and clears when filters change. Existing bulk permissions, version conflict handling, import/export and refund accounting remain unchanged.

All surfaces and interaction fills consume existing theme tokens, preserving Cozy, Elegant and Vibrant light/dark palettes. No database changes are required.

Validation covers filter parsing, serialization, intersections, sorting, selection across pages, the selection cap, record details and toolbar/menu actions. The modal focus fixture uses an explicit intermediate assertion for its synthetic DOMRectList so standalone TypeScript checks can validate the tests as well.

## Personal row-menu consistency

Personal desktop row menus use equally sized, labelled Edit, Exclude and Delete actions with 44px touch targets. The popup uses viewport-bounded fixed placement and opens above its trigger when space below is insufficient. Scrolling the ledger or resizing dismisses it so it cannot remain detached from a record. Already-excluded records retain the disabled Exclude action. Mobile Personal cards continue to open the existing editor directly, without adding a second row menu. Regression tests exercise desktop and narrow viewport bounds, dismissal and the Edit callback.

## Pagination and month counts

Desktop paging shares the totals footer: month count and filtered-match count on the left, compact range/arrows in the middle, visible cash total on the right. A single-page result (zero to 50 records) has no pagination controls. Mobile fixes the labelled compact pager directly above the measured bottom navigation, making it reachable throughout the list. A 56px pager strip has reserved page space; the floating Add action moves above it. Paging continues to use 50 records, disables unavailable/busy directions and retains cross-page selection. The desktop list returns to its top when a page is requested. Mobile scrolls the first transaction into view with clearance based on the measured sticky header. Single-page results have neither the pager nor its additional reserved spacing.

Both ledgers show the selected month's transaction count independently of search, category/type, payer and amount filters. Group counts exclude voided records; Personal counts use the loaded ledger/business dataset. These counts include budget-excluded records because exclusion affects financial totals rather than record existence. The visible total and filtered match count retain their existing meaning and may cover more than the selected month when browsing all dates. Neither count is a database-wide total beyond the authorized loaded dataset.

## Refresh feedback

Refreshing an already loaded Group ledger uses the shared animated Sprout mark in an absolute translucent `.record-loading-veil` overlay (82% semantic card colour with a 2px backdrop blur) inside the record viewport. Desktop centers the mark in the visible scrolling area; mobile places it near the top of the list. The explicit CSS colour mix is required because Tailwind alpha modifiers do not generate a usable colour for the plain `var(--card)` token. The veil softens stale records while keeping their layout visible; the record list is inert during refresh to prevent mouse or keyboard actions on stale rows. The table header and totals remain outside the veil. It never creates an extra row below the totals, changes the table height, replaces the navigation shell or displays an empty-results message while loading. Existing records remain visible and the list exposes `aria-busy`; the mark supplies the localized status label.

## Startup versus data loading

Full-page session startup keeps the animated Sprout mark. Once authentication is resolved, shared `LoadingRegion` uses quiet theme-token skeleton rows within the mounted page shell. This avoids a second logo splash moving from screen centre into the content area during the same refresh. `SkeletonRows` now renders the requested number of neutral placeholders (no shimmer or repeated logo), including its localized accessible loading status. Table refreshes with existing data still use the translucent record-area veil and Sprout mark.
