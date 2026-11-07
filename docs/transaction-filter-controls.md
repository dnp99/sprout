# Transaction filter controls

Member selection in Groups and business selection in Personal live inside the shared Filters disclosure on desktop and mobile. This keeps the type row focused on transaction type.

An applied member or business scope appears as a removable chip below search even when Filters is closed. The Filters button displays a badge for these applied scope chips. Removing a chip preserves the query and other filters; removing a business scope also restores its selected-month period. Clear filters resets the business scope as well.

SearchDialog owns chip presentation, accessible removal labels, and the badge. Colors use semantic theme tokens, with the same layout across themes and appearances. Existing filter state and selection behavior are retained.
