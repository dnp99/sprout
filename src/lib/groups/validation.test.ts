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
