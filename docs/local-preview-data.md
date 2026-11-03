# Local preview data

The isolated local preview uses a fictional Alex account (`alex@example.test`) and Maple House group. Its database name starts with `sprout_local_preview_`; it is separate from the configured shared application database. Local preview metadata and startup helpers live outside the repository under the operating system temporary directory and must not be committed because they include local credentials.

The pagination fixture appends 150 fictional entries (135 expenses and 15 contributions) plus four linked partial refunds through the normal authenticated Group API. November 2026 receives 120 entries and four refunds; October receives 30 entries. Existing records are preserved. Categories and payer/shared-funds values vary. Dates are bounded to the demo period, and all amounts use integer cents. Stable mutation identifiers make reapplying this fixture non-duplicating.

After seeding, refresh the local Group Transactions page and choose November 2026 to test three pages at 50 records per page, monthly versus filtered counts, category/payer/type filters and cross-page selection. October provides a separate smaller month. Do not apply the local fixture to a shared or production account.
