# Business transaction activity

Businesses are optional labels on Personal transactions. They do not create a
separate ledger, change budget categories, or affect Group accounting.

Click a business name in Personal Settings to open Transactions for that business
across all dates. The pencil still renames it. This drill-down clears unrelated
search, category, date, amount, and mobile transaction-kind filters. Transactions
also offers All businesses, No business, and individual businesses; mobile places
these controls inside Filters to preserve the compact ledger layout.

An active business shows matching income, spending, and net activity. Refunds
reduce spending; excluded transactions do not enter totals. Other search/type/
category/amount/date filters intersect the business scope. Select Selected month
or All dates in the business reporting control. All-date views disable the month
stepper rather than presenting a misleading month. Results remain editable with
the existing Personal transaction actions. Changing businesses clears bulk
selection so hidden rows cannot be mutated accidentally.

Business scope and reporting mode survive refresh and browser history through
`/transactions?business=<id>&scope=all` (omit scope for Selected month), and are
included in saved views. No business uses `__no_business__`; missing legacy
assignments are treated as unassigned. Business selection is reset on logout.

## Complete history and authorization

`GET /api/transactions?businessId=<id>&limit=500&offset=0` validates the business
UUID and ownership before reading any records. No-business queries always retain
the authenticated user constraint. Responses include `transactions`, `hasMore`,
and `userId`, and prohibit caching. The repository uses the stable existing date,
creation-time and ID ordering plus an offset; a look-ahead row detects more pages.
Ordinary working-set requests retain their existing response shape.

The client reads every business page instead of relying on the normal 5,000-row
working set. A per-store loader deduplicates responsive mounts, aborts superseded
requests, rejects account changes, and merges historical records into the shared
transaction store so existing editors work. Transaction changes invalidate the
business cache. Loading or failed pages never display partial totals as complete;
errors provide Retry. Global AI backlog categorization is hidden while a business
scope is active because that job is not restricted to a business.

Coverage includes ownership rejection, pagination, late responses after logout,
refund/exclusion totals, combined filters, saved-view serialization, URL/history
restoration, and bulk selection reset. Browser verification uses fictional data.
