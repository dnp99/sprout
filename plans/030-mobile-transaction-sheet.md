# Mobile transaction entry sheet — local trial

User scope: Personal and Groups on mobile; keep desktop centered editing.

- Fill the current visual viewport, including when a native keyboard opens.
- Compact header with Close, destination/title, and primary Save.
- Visible native numeric Amount field; retain integer-cent input and the
  Amount → Merchant → Category keyboard handoff.
- Keep required merchant/category/date and Group payer directly accessible.
- Collapse optional metadata under More details without losing draft values.
- One scrolling body; no sticky save footer or oversized amount/keypad area.
- Preserve all domain validation, pending-operation guards, and ledger adapters.

Local validation: meaningful form/portal tests; full lint/tests/build; Personal
and Group layouts at 393×852 and reduced keyboard-height viewports; desktop
regression and all appearance modes. Native Safari/PWA keyboard handoff, date
input sizing and orientation must still be verified on a physical iPhone.

No deployment or push is included in this local trial.

Local trial results: lint and production build pass; 749 tests pass (49 skipped).
Browser checks confirm Personal keyboard handoff, Group payer visibility,
collapsed optional fields, a 393px-wide sheet with no horizontal overflow at
420px viewport height, and the centered 560px desktop dialog with footer Save.
The current browser appearance was Cozy; the new layout uses existing semantic
tokens throughout. Physical iPhone and remaining appearance checks are pending.

## Desktop follow-up

User expanded scope to desktop: regular amount input with Calculator at its
label, full-width transaction type controls, and collapsed optional details.
The centered dialog and footer Save remain. Shared keyboard/validation behavior
and palette tokens are reused.
