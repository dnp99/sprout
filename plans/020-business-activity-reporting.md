# 020 — Business activity reporting

**Status:** Proposed · **Created:** 2026-09-06

## Outcome

Let someone who runs a side business, such as Yoga, see every related income
and expense for a chosen month, trailing six months, trailing year, or a custom
period. The result is a useful business view: transactions, income, expenses,
net profit, and count.

Yoga is a business assignment, not a spending category. This lets a transaction
remain accurately categorised as Studio rent, Supplies, or Marketing while
still belonging to Yoga. It also applies to positive transactions such as class
payments and private sessions.

## Why a new model is needed

Sprout already has `income_sources` (including a Side business source), but
they deliberately apply only to positive transactions. Categories likewise do
not work for this feature: a transaction has one category, and income has no
expense category. Neither can group both sides of a business profit-and-loss
view without losing useful category information.

## Product decisions

- Call the concept **Businesses** in Settings and **Business** in transaction
  forms and filters. The model may later serve projects or freelance work, but
  the v1 language should be immediately clear.
- A transaction has zero or one business assignment. A user cannot allocate a
  single transaction between businesses in v1; that needs split transactions
  and is intentionally deferred.
- A business has `name`, `emoji`, `color`, and `sortOrder`. It has no budget,
  account, or tax calculation fields.
- Existing transactions stay unassigned after migration. No heuristic or
  automatic backfill is attempted.
- Deleting a business preserves its transactions and clears their assignment.
- A business may share its name with an income source, but the two concepts
  remain independent. For Yoga income, the user can select both `Income source:
  Side business` and `Business: Yoga`.
- Date presets use calendar boundaries in the user's locale: **Month** is the
  selected calendar month; **6 months** and **1 year** include the selected
  month plus the preceding five or eleven complete calendar months. A custom
  range remains available for tax years and ad-hoc reporting.

## Data model and migration

Add a user-owned `businesses` table:

```text
businesses
  id, user_id, name, emoji, color, sort_order, created_at, updated_at

transactions
  ... existing fields ...
  business_id nullable → businesses.id (ON DELETE SET NULL)
```

Add indexes that support the primary report query:

- `(user_id, business_id, occurred_at)` on `transactions`
- `(user_id, sort_order)` on `businesses`

Update [`src/db/schema.ts`](../src/db/schema.ts), then generate the migration
with `npm run db:generate`; never hand-author the Drizzle SQL or snapshot. Run
`npm run db:migrate` only with the required live database configuration.

## Backend and domain work

1. Add `src/lib/businesses/{dto,repository,validation}.ts` and colocated unit
   tests. The repository owns list/create/update/delete and verifies business
   ownership before a transaction can reference it.
2. Extend the transaction DTO with `businessId`, `businessName`, `businessEmoji`,
   and `businessColor`. Join businesses in every transaction read path.
3. Extend create/update transaction validation and repository writes with an
   optional `businessId`. Reject an ID that does not belong to the signed-in
   user.
4. Add thin, session-authenticated `/api/businesses` CRUD routes. Add a bulk
   transaction assignment route so historical Yoga rows can be labeled quickly.
5. Add a pure report helper that takes filtered business transactions and
   returns signed-cents totals for income, expenses, net profit, and count.
   All display formatting stays at the component boundary via `formatMoney()`.

## Filtering, saved views, and periods

Extend `FilterOptions` and `filterTransactions` with `businessIds?: string[]`.
The IDs use OR semantics, matching the existing multi-category filter behavior.
An unset business filter preserves all current transaction views.

Extend the persisted saved-view filter schema to include `businessIds`, with
sanitisation equivalent to `categoryIds`. Existing saved views must continue to
load unchanged.

Extract a pure date-range helper for the Month / 6 months / 1 year preset
boundaries. Both desktop Transactions and mobile Search must call that helper,
not duplicate date arithmetic. Selecting a period writes the existing
`dateFrom`/`dateTo` filter fields, so custom ranges and saved views need no
separate representation.

## User experience

### Setup and assignment

- Settings gains a Businesses panel beside Income Sources. It supports create,
  rename, reorder, and delete.
- Add and Edit Transaction show an optional Business picker for both income and
  expenses.
- Inline editing and desktop/mobile bulk actions can assign or clear a business
  on existing transactions.
- CSV mapping gains an optional Business column. Imports only match existing
  business names in v1; unknown values are surfaced in import review rather
  than silently creating businesses.

### Viewing Yoga activity

- Transactions filters gain a Business multi-select.
- Once one business is selected, show compact period choices: selected month,
  6 months, 1 year, and Custom. The date range remains visible and editable.
- Above the filtered list, show `Income`, `Expenses`, `Net profit`, and
  `N transactions`; it must reflect all active filters, not just Business.
- Save a filtered view such as `Yoga — Last 6 months` through the existing Saved
  Views control. Recalling it restores the business and date filters.
- Mobile Search offers equivalent controls and summary, respecting the existing
  44px touch-target requirement.

## Delivery slices

1. **Data foundation:** schema, generated migration, DTO/types, ownership-aware
   validation and transaction CRUD, businesses repository/API, unit and route
   tests.
2. **Assignment:** store/API client methods; Settings manager; Add/Edit,
   inline, and bulk assignment controls on web and mobile; translations.
3. **Filtering and reporting:** business filter, shared calendar-period helper,
   report summary, saved-view persistence/sanitisation, web and mobile UI.
4. **Import and polish:** optional CSV mapping, import-review feedback,
   accessibility states, documentation, regression sweep.

## Test matrix

- Business CRUD is user-scoped; another user's ID cannot be assigned or read.
- Delete clears `business_id` while preserving all transaction rows.
- Positive and negative transactions can both be assigned; categories and income
  sources remain unchanged.
- Business filters work alone and combined with search, type, category, amount,
  selected-month, and custom date filters.
- Month / 6-month / year helpers return the correct inclusive calendar dates at
  year boundaries and in leap years.
- Income, expenses, net, and count derive from cents correctly, including a
  negative net result and empty result set.
- Saved views round-trip business IDs and remain compatible with existing view
  JSON that has no business filter.
- Web and mobile expose equivalent filter/assignment behavior; keyboard,
  screen-reader labels, and dark mode remain intact.

## Documentation and verification

- Update [`docs/transactions.md`](../docs/transactions.md) with Business scope,
  preset semantics, report totals, and saved-view behavior.
- Update [`docs/er-diagram.md`](../docs/er-diagram.md) to include businesses and
  the nullable transaction relationship.
- Add comments for the calendar-boundary and deletion semantics where the code
  is non-obvious.
- Before handing off: `npm run lint`, `npm run test`, and `npm run build`.

## Out of scope

- Split transactions or percentage allocation across businesses.
- Tax deductions, tax estimates, invoices, client records, or accounting
  statements.
- Automatic merchant-to-business rules.
- Sharing a business with another Sprout user.
