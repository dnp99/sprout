# 021 — Reimbursements

**Status:** In progress · **Created:** 2026-09-06

## Outcome

An incoming repayment from a friend can be recorded as a **reimbursement** for
an expense category, rather than income. A $300 Grocery expense plus a $100
Grocery reimbursement reports $200 net Grocery spending, while the $100 stays
out of Income totals and income-source reports.

## Design

- Add `reimbursement` to the existing transaction `kind` values. The database
  column is already text, so no schema migration is required.
- Reimbursements must be positive and have an expense category. They cannot
  have an income source.
- The shared transaction editor lets a user change an incoming transaction from
  Income to Reimbursement and select its category. It never offers the
  merchant-wide category-rule shortcut for reimbursements.
- Existing positive rows remain income-compatible. Only rows explicitly marked
  `reimbursement` are removed from Income totals.
- Budget, category, transaction, and trend calculations include a reimbursement
  as a negative expense contribution, so a reimbursement reduces net spending.

## Verification

- Validation rejects a negative or uncategorized reimbursement and an income
  source on a reimbursement.
- Income filters and totals exclude reimbursements.
- Category and budget totals net reimbursements against their category.
- Existing income and expense behaviour remains unchanged.

## Documentation

Update `docs/transactions.md` with the type, edit flow, and reporting rules.
