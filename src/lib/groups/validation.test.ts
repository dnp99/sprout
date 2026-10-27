import { it, expect } from "vitest";
import { parseOperation, date, cents, month } from "./validation";
import { groupReturnPath } from "./navigation";
const id = "11111111-1111-4111-8111-111111111111";
it("rejects overflow, fractional cents, impossible dates and malformed months", () => {
  for (const amount of [1.2, -1, 2147483648, NaN]) expect(() => cents(amount)).toThrow();
  expect(() => date("2026-02-30")).toThrow();
  expect(() => month("2026-13")).toThrow();
  expect(date("2026-02-28")).toBe("2026-02-28");
});
it("validates monthly allocation totals", () => {
  expect(() =>
    parseOperation({
      mutationId: id,
      revision: 0,
      type: "budget",
      month: "2026-10",
      poolCents: 100,
      allocations: { [id]: 101 },
    }),
  ).toThrow();
});
it("does not accept arbitrary return URLs or invitation tokens as a login target", () => {
  expect(groupReturnPath("https://evil.test/groups")).toBeNull();
  expect(groupReturnPath("//evil.test")).toBeNull();
  expect(groupReturnPath(`/groups/${id}/budget`)).toBe(`/groups/${id}/budget`);
  expect(groupReturnPath("/groups?invite=secret")).toBeNull();
});

it("allows empty shared descriptions while preserving length and type checks", () => {
  const draft = {
    mutationId: id,
    revision: 0,
    type: "entry",
    entry: {
      kind: "income",
      amountCents: 25000,
      occurredOn: "2026-10-27",
      settlement: false,
      splitMethod: "equal",
      participants: [],
    },
  };
  for (const merchant of [undefined, "", "   "]) {
    const parsed = parseOperation({ ...draft, entry: { ...draft.entry, merchant } });
    expect(parsed.operation.type).toBe("entry");
    if (parsed.operation.type === "entry") expect(parsed.operation.entry.merchant).toBe("");
  }
  for (const merchant of [42, "a".repeat(121)])
    expect(() => parseOperation({ ...draft, entry: { ...draft.entry, merchant } })).toThrow();
});
