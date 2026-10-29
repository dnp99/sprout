import { expect, it } from "vitest";
import { resolveGroupSplit, splitDefault, splitDraft } from "./splits";
const members = [
  { id: "a", status: "active" },
  { id: "b", status: "active" },
];
const participants = [
  { memberId: "a", weight: 7500 },
  { memberId: "b", weight: 2500 },
];
it("uses category overrides, explicit equal rules, and the group fallback", () => {
  const splitDefaults = splitDefault("percentage", participants, members);
  const equal = { categoryId: "rent", ...splitDefault("equal", [], members) };
  const data = { splitDefaults, categorySplits: [equal] };
  expect(resolveGroupSplit(data, "rent")).toBe(equal);
  expect(resolveGroupSplit(data, "food")).toBe(splitDefaults);
  expect(resolveGroupSplit(data, null)).toBe(splitDefaults);
  expect(splitDraft(splitDefaults, members)).toEqual({
    method: "percentage",
    participants: { a: "75", b: "25" },
  });
  expect(splitDraft(equal, members)).toEqual({ method: "equal", participants: { a: "0", b: "0" } });
});
it("requires every active member, unique bounded integer weights and exactly 100%", () => {
  expect(splitDefault("percentage", participants, members).valid).toBe(true);
  for (const weights of [
    participants.slice(0, 1),
    [...participants, participants[0]],
    [
      { memberId: "a", weight: 7500 },
      { memberId: "b", weight: 2499 },
    ],
    [
      { memberId: "a", weight: 10001 },
      { memberId: "b", weight: -1 },
    ],
    [
      { memberId: "a", weight: 7500.5 },
      { memberId: "b", weight: 2499.5 },
    ],
  ])
    expect(splitDefault("percentage", weights, members).valid).toBe(false);
  expect(
    splitDefault("percentage", participants, [...members, { id: "c", status: "active" }]).valid,
  ).toBe(false);
  expect(
    splitDefault("percentage", participants, [members[0], { ...members[1], status: "left" }]).valid,
  ).toBe(false);
  expect(
    splitDefault("equal", [], [...members, { id: "c", status: "left" }]).participants,
  ).toHaveLength(2);
});
it("does not silently renormalize invalid rules and excludes zero shares from drafts", () => {
  const split = splitDefault(
    "percentage",
    [
      { memberId: "a", weight: 10000 },
      { memberId: "b", weight: 0 },
    ],
    members,
  );
  expect(splitDraft(split, members).participants).toEqual({ a: "100" });
  expect(splitDraft({ ...split, valid: false }, members)).toEqual({
    method: "equal",
    participants: { a: "0", b: "0" },
  });
});
