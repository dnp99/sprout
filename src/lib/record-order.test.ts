import { expect, it } from "vitest";
import { compareRecordOrder } from "./record-order";
it("keeps reporting dates primary and puts newly created records first within the day", () => {
  const rows = [
    { id: "old", date: "2026-10-15T23:00:00Z", createdAt: "2026-10-15T23:00:00Z" },
    { id: "backdated", date: "2026-10-15T00:00:00Z", createdAt: "2026-10-28T02:00:00Z" },
    { id: "next", date: "2026-10-16", createdAt: "2026-10-16T00:00:00Z" },
  ];
  expect([...rows].sort(compareRecordOrder).map((r) => r.id)).toEqual(["next", "backdated", "old"]);
});
