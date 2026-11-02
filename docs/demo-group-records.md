# Demo Group records

`npx tsx scripts/seed-demo-group.ts --group=<UUID>` previews an append-only fixture
for an existing active Group belonging to the seeded demo account. Add `--apply`
to save. It never creates accounts, invitations or members, or resets existing data.

The fixture contains 54 expenses, six income records and four linked partial
refunds. Records span the current and previous Toronto calendar months, include
existing categories and uncategorized items, shared funds and member-paid items,
and short/long fictional notes marked `[Demo]`. No future dates are generated.
The current month contains at least 36 records; both months together exercise
pagination, search, type/category filters, calendar and insights.

Normal Group validation, revision checks, activity logging and notification
queuing apply. No invitations or outbound messages are sent by the script.
Stable monthly mutation keys prevent duplicates when rerun during the same month;
do not change the fixture payload and reuse those keys. Other members, repayment
and split scenarios require real additional test memberships; this script does
not invent members or mark any repayments/splits completed.
