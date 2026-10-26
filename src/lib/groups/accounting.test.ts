import { describe, it, expect } from "vitest";
import { allocate, refundShares, balances, transfers, monthlySummary } from "./accounting";
import type { GroupEntry, GroupRepayment } from "./dto";
const expense = (patch: Partial<GroupEntry> = {}): GroupEntry => ({
  id: "expense",
  authorId: "a",
  payerId: "a",
  categoryId: "food",
  kind: "expense",
  amountCents: -12000,
  merchant: "Food",
  note: "",
  occurredOn: "2026-10-25",
  refundOf: null,
  settlement: true,
  splitMethod: "equal",
  version: 0,
  voidedAt: null,
  shares: allocate(12000, [
    { memberId: "a", weight: 1 },
    { memberId: "b", weight: 1 },
  ]),
  ...patch,
});
const payment = (patch: Partial<GroupRepayment> = {}): GroupRepayment => ({
  id: "payment",
  senderId: "b",
  recipientId: "a",
  recordedBy: "a",
  amountCents: 2500,
  occurredOn: "2026-10-25",
  note: "",
  reversedAt: null,
  reversalReason: null,
  ...patch,
});
describe("household accounting", () => {
  it("conserves every cent with deterministic equal and weighted splits", () => {
    for (let n = 1; n <= 199; n++) {
      const shares = allocate(n, [
        { memberId: "c", weight: 1 },
        { memberId: "a", weight: 1 },
        { memberId: "b", weight: 1 },
      ]);
      expect(shares.reduce((s, p) => s + p.amountCents, 0)).toBe(n);
      expect(
        Math.max(...shares.map((s) => s.amountCents)) -
          Math.min(...shares.map((s) => s.amountCents)),
      ).toBeLessThanOrEqual(1);
    }
    expect(
      allocate(1, [
        { memberId: "b", weight: 1 },
        { memberId: "a", weight: 1 },
      ]).find((s) => s.memberId === "a")?.amountCents,
    ).toBe(1);
  });
  it("supports a payer excluded from participants and zero percentage shares", () => {
    const e = expense({
      shares: allocate(12000, [
        { memberId: "b", weight: 10000 },
        { memberId: "c", weight: 0 },
      ]),
    });
    expect(balances([e], [])).toEqual({ a: 12000, b: -12000, c: 0 });
  });
  it("keeps repayments out of spending and includes all-time balance changes", () => {
    const e = expense();
    expect(balances([e], [payment()])).toEqual({ a: 3500, b: -3500 });
    expect(monthlySummary([e], "2026-10", "b").spendingCents).toBe(12000);
    expect(monthlySummary([e], "2026-11", "b").yourShareCents).toBe(0);
  });
  it("refunds reverse shares and never become income", () => {
    const e = expense(),
      refund = expense({
        id: "refund",
        kind: "refund",
        amountCents: 2000,
        refundOf: e.id,
        shares: refundShares(2000, e.shares, []),
      });
    expect(balances([e, refund], [payment()])).toEqual({ a: 2500, b: -2500 });
    expect(monthlySummary([e, refund], "2026-10", "b")).toMatchObject({
      spendingCents: 10000,
      incomeCents: 0,
      yourShareCents: 5000,
    });
  });
  it("many partial penny refunds cannot exceed any original share", () => {
    for (let n = 1; n < 60; n++) {
      const original = allocate(n, [
          { memberId: "a", weight: 1 },
          { memberId: "b", weight: 1 },
          { memberId: "c", weight: 1 },
        ]),
        prior: typeof original = [];
      for (let i = 0; i < n; i++) prior.push(...refundShares(1, original, prior));
      for (const s of original)
        expect(
          prior.filter((p) => p.memberId === s.memberId).reduce((n, p) => n + p.amountCents, 0),
        ).toBe(s.amountCents);
      expect(() => refundShares(1, original, prior)).toThrow();
    }
  });
  it("shared funds and attribution-only shares create no debt", () => {
    expect(balances([expense({ payerId: null, settlement: false })], [])).toEqual({});
    expect(monthlySummary([expense({ settlement: false })], "2026-10", "a").yourShareCents).toBe(
      6000,
    );
  });
  it("reversal retains history while undoing only its balance effect", () => {
    expect(balances([expense()], [payment({ reversedAt: "2026-10-26" })])).toEqual({
      a: 6000,
      b: -6000,
    });
    expect(balances([expense()], [payment({ amountCents: 8000 })])).toEqual({ a: -2000, b: 2000 });
  });
  it("suggestions preserve net balances across multiple payers", () => {
    const b = { a: 8000, b: -3000, c: -5000 };
    const result = transfers(b),
      resolved: Record<string, number> = { ...b };
    for (const r of result) {
      resolved[r.from] += r.amountCents;
      resolved[r.to] -= r.amountCents;
    }
    expect(Object.values(resolved)).toEqual([0, 0, 0]);
  });
});
