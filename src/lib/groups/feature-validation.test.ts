import { expect, it } from "vitest";
import { parseOperation } from "./validation";
const key = "00000000-0000-4000-8000-000000000001";
const parse = (op: Record<string, unknown>) =>
  parseOperation({ ...op, mutationId: key, revision: 0 }).operation;
const goal = {
  name: "Trip",
  emoji: "🎯",
  color: "#123456",
  targetCents: 10000,
  savedCents: 0,
  targetDate: null,
  isRoundupTarget: false,
};
it("keeps plan amounts bounded to integer cents and rejects impossible dates", () => {
  expect(parse({ type: "goal", value: goal })).toMatchObject({ type: "goal", value: goal });
  for (const targetCents of [1.5, 2147483648, Infinity])
    expect(() => parse({ type: "goal", value: { ...goal, targetCents } })).toThrow();
  expect(() => parse({ type: "goal", value: { ...goal, targetDate: "2026-02-30" } })).toThrow();
  expect(() => parse({ type: "recurringPaid", id: key, dueDate: "2026-02-30" })).toThrow();
});
it("requires group-compatible identifiers on recurring categories and deletes", () => {
  expect(() => parse({ type: "goalDelete", id: "bad" })).toThrow();
  expect(() =>
    parse({
      type: "recurring",
      value: {
        name: "Rent",
        amountCents: -100,
        cadence: "monthly",
        dayOfMonth: 1,
        categoryId: "bad",
      },
    }),
  ).toThrow();
});
