import { expect, it } from "vitest";
import { groupTransactionsCsv } from "./export-csv";
import { parseCsv } from "@/lib/import/read-csv";
import type { GroupEntry, GroupMember } from "./dto";
it("exports signed amounts, payer and author while excluding voids and neutralizing text formulas", () => {
  const entry = {
    id: "1",
    merchant: "=FORMULA()",
    kind: "expense",
    amountCents: -1234,
    occurredOn: "2026-10-01",
    payerId: "b",
    authorId: "a",
    note: "shared, groceries",
    voidedAt: null,
  } as GroupEntry;
  const members = [
    { id: "a", name: "Author" },
    { id: "b", name: "Payer" },
  ] as GroupMember[];
  const rows = parseCsv(groupTransactionsCsv([entry, { ...entry, voidedAt: "now" }], members, []));
  expect(rows).toHaveLength(2);
  expect(rows[0]).toContain("Payer");
  expect(rows[1]).toEqual([
    "2026-10-01",
    "'=FORMULA()",
    "-12.34",
    "Group",
    "Expense",
    "",
    "Payer",
    "Author",
    "shared, groceries",
  ]);
});
