# Manual transaction requirements

Personal and Groups require an amount and a category when adding transactions
on mobile or desktop. Expense and income use the same policy. Reimbursements
and group merchant refunds also retain their category relationship.

`src/lib/transactions/requirements.ts` is the common pure policy. Drafts need a
positive integer-cent amount and a nonblank category ID. Signed API amounts use
the same integer/nonzero validation, allowing negative stored expenses. The
helper returns stable issue keys; messages in `transactionRequirements` cover
all four locales. No floats or display-currency conversions enter this logic.

Both Personal Save buttons, the Personal store's `commitAdd`, and the Group
entry form use the shared policy. Save remains disabled until requirements are
met. Category uses a visible asterisk; the amount display has no visible label
and retains an accessible Amount label. There is no required-fields sentence.
Required inputs expose their state to assistive technology. Invalid
interactions or submit attempts show a red outline and inline error on the
amount box/category picker; correcting the value clears it immediately. Untouched
drafts stay neutral. A new Personal draft begins with no category instead
of silently choosing the first budget category. Explicit category context can
still prefill a draft. Personal income shows the category picker in addition to
its optional income source; the chosen category is retained in the saved row.
Income classification and budget accounting still follow transaction kind.

## Server enforcement

- `POST /api/transactions` enables the manual category policy through
  `validateCreateTransaction(..., { requireCategory: true })` and checks that the
  category belongs to the signed-in user. The body cannot disable this policy.
- Group manual entry operations enable required validation inside `saveEntry`.
  Validation occurs after merchant rules and refund inheritance resolve the
  effective category. Group category ownership/archive checks remain in place.
- A new refund of an older uncategorized expense must wait until the original
  expense is categorized. The form explains this; submitting a different
  category cannot bypass the inherited-category check on the server.

Edits to existing uncategorized records remain possible so users can repair
them. Import, automated capture and recurring generation retain their existing
uncategorized review workflow. They use separate server paths and do not change
the manual policy. Existing stored transactions are not rewritten; there is no
schema change or migration.
