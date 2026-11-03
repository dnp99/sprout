# Desktop transaction density

Personal and Group Transactions use a compact desktop layout from 1024px. Search and its advanced-filter disclosure share the toolbar with secondary actions and Add transaction. Transaction types and business/payer filters appear on the preceding row, above the search/action toolbar. On narrower desktop windows the toolbar wraps rather than hiding controls; opening advanced filters expands the same toolbar naturally.

Rows are 56px tall in both ledgers. Personal’s `TRANSACTION_ROW_HEIGHT` is the source for both the rendered row and virtualized offsets, so scrolling a large ledger cannot drift from the row geometry. Group rows use matching 56px minimums and may grow for additional metadata. Table headings are 44px high and totals footers use reduced vertical padding while retaining labels and financial context. Category rail options also use compact desktop spacing. All themes share this geometry, while mobile layouts and touch targets remain unchanged.

This reclaims a dedicated search row and reduces repeated row/chrome spacing without hiding information, changing pagination or altering accounting. The number of visible records depends on viewport height, browser zoom, wrapping and any expanded filters or bulk controls.
