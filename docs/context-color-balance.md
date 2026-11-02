# Shared theme and ledger identity

Personal and Groups use the same palette for the selected visual theme and
light/dark mode. Cozy follows the [artwork palette](cozy-palette.md); Vibrant
uses its Sky Blue palette in both spaces. This supersedes the earlier green/orange
ledger color split, strict 65:35 color dominance and olive Group rail proposal.
Switching financial spaces must not look like changing the visual theme.

`globals.css` defines common shell, rail, action and surface-role tokens.
`cozy-workspaces.css` assigns those roles to existing panels. Equivalent controls,
calendar selections, account chrome and reporting menus inherit the same colors.
Category accents remain user data; status colors still communicate income,
warning and destructive actions. Personal and Group functionality stays separate.

## Persistent context

The Personal / Groups switch uses the same filled selected style and checkmark
in either context, with `aria-current="page"` on the active link. The active side
uses 70% with icon and label; the inactive side uses 30% with its icon and an
accessible name, so color is never the only identifier.

`LedgerContextLabel` shows a group icon and **Group · Maple House** above Group
page titles on mobile and desktop. Personal omits the redundant context line.
The Group Home heading is **Overview**, with group identity in the context line.
Long group names truncate without pushing month controls to another row and
retain the full name in a tooltip. The multiple-group Home picker retains a
44px target beside the title and uses the existing group route callback.

Transaction dialog headers show a group icon and group name, or a person icon
and Personal, beneath the title outside the scrolling form. These are destination cues, not changes to permission,
recording, splitting or saving behavior. All text uses the existing four locales.
