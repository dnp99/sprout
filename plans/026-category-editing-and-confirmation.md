# Category editing and confirmation cleanup

Requested 2026-10-29. Personal and group ledgers share editing behavior and the
existing default category definitions; user selected independent category data,
not cross-ledger synchronization.

- Open category editing in a focused dialog with name, icon and icon color.
- Remove category Archive actions. Put a clearly destructive Delete action at
  the bottom, separated from Save. Deleting a category keeps its transactions
  as uncategorized and promotes its children; it never deletes financial rows.
- Reuse one organizer for Personal and Groups. Persist sibling order and two
  category levels. For changed levels with records, ask in plain language whether
  records move with the category or become uncategorized. Save applies directly.
- Remove extra confirmations for ordinary add/edit/discard and deletions of up
  to five records. Confirm deletion of more than five records and whole-group
  removal. Keep authorization, revision checks and server validation.
- Remove duplicate Export CSV from Group Settings. Put group archive/exit/removal
  actions in a separate bottom management section, away from ordinary settings.
- Document schema and behavior and verify transactions, split snapshots, foreign
  ownership, hierarchy/order persistence and the 5/6-record confirmation boundary.

## Additional requested parity

Use the personal rail's typography, spacing and collapse behaviour for groups.
Replace the group Goals/Recurring placeholders with the same working screens,
forms and reports used for personal ledgers. Keep all household plans and
completion records in group-owned tables, and retain explicit-only splitting.
The shared screens receive their scope via a provider, not copied personal data.
