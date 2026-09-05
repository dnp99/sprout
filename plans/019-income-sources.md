# 019 — Income sources

## Outcome

Users can label positive transactions with a source such as Main job, Side
business, or Refunds. Sources are distinct from expense budget categories and
drive the Income breakdown in Trends.

## Design

- `income_sources` belongs to a user and has a name, emoji, and sort order.
- `transactions.income_source_id` is nullable. Existing income remains valid
  and falls back to the label “Income” until assigned.
- Income sources carry no budget allocation or spending total.
- The Add and Edit transaction flows show a source picker only for income.
- Settings manages sources. Imports can map an income-source column, and
  multi-select can assign a source to historical income rows.
- Trends groups income by source; it does not reuse expense categories.

## Migration safety

The migration adds nullable records and a nullable foreign key only. It never
guesses historical income sources or changes existing categories.

## Verification

- Source ownership is enforced in every API write.
- A source can be assigned to a positive transaction but not an expense.
- Deleting a source preserves transactions and clears the source reference.
- Income reports group Main job and Side business separately, while unassigned
  income remains under “Income”.
