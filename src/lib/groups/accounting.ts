import type { GroupEntry, GroupRepayment, GroupShare } from "./dto";
import { GroupError } from "./validation";

/** Integer arithmetic and stable ID ties ensure every cent is conserved. */
export function allocate(
  amount: number,
  weights: { memberId: string; weight: number }[],
): GroupShare[] {
  const total = weights.reduce((n, w) => n + w.weight, 0);
  if (
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    !weights.length ||
    total <= 0 ||
    weights.some((w) => !Number.isInteger(w.weight) || w.weight < 0) ||
    new Set(weights.map((w) => w.memberId)).size !== weights.length
  )
    throw new GroupError("Choose valid split participants.");
  const rows = weights.map((w) => {
    const product = BigInt(amount) * BigInt(w.weight);
    return {
      ...w,
      amountCents: Number(product / BigInt(total)),
      remainder: product % BigInt(total),
    };
  });
  let remaining = amount - rows.reduce((n, r) => n + r.amountCents, 0);
  for (const row of [...rows].sort((a, b) =>
    a.remainder === b.remainder
      ? a.memberId.localeCompare(b.memberId)
      : a.remainder > b.remainder
        ? -1
        : 1,
  )) {
    if (remaining-- > 0) row.amountCents++;
  }
  return rows.map(({ memberId, amountCents, weight }) => ({ memberId, amountCents, weight }));
}

/** Allocate against remaining original capacities, never refunding a member more
 * than their original share even across many one-cent partial refunds. */
export function refundShares(
  amount: number,
  original: GroupShare[],
  prior: GroupShare[],
): GroupShare[] {
  const capacities = original.map((s) => ({
    ...s,
    remaining:
      s.amountCents -
      prior.filter((p) => p.memberId === s.memberId).reduce((n, p) => n + p.amountCents, 0),
  }));
  if (
    capacities.some((s) => s.remaining < 0) ||
    capacities.reduce((n, s) => n + s.remaining, 0) < amount
  )
    throw new GroupError("Refund exceeds the remaining expense.");
  // Remaining capacity is the weight, so full refunds exhaust it exactly.
  return allocate(
    amount,
    capacities.map((s) => ({ memberId: s.memberId, weight: s.remaining })),
  ).map((s) => ({ ...s, weight: original.find((o) => o.memberId === s.memberId)!.weight }));
}

/** Repayments affect obligations only; household spending uses ledger entries. */
export function balances(
  entries: GroupEntry[],
  repayments: GroupRepayment[],
): Record<string, number> {
  const result: Record<string, number> = {};
  const add = (id: string, n: number) => {
    result[id] = (result[id] ?? 0) + n;
    if (!Number.isSafeInteger(result[id]))
      throw new GroupError("The group balance exceeds the supported range.");
  };
  for (const e of entries) {
    if (e.voidedAt || !e.settlement || !e.payerId || e.kind === "income") continue;
    const sign = e.kind === "expense" ? 1 : -1;
    add(e.payerId, sign * Math.abs(e.amountCents));
    e.shares.forEach((s) => add(s.memberId, -sign * s.amountCents));
  }
  for (const r of repayments)
    if (!r.reversedAt) {
      add(r.senderId, r.amountCents);
      add(r.recipientId, -r.amountCents);
    }
  return result;
}

/** Net transfer suggestions preserve balances without claiming to move money. */
export function transfers(balance: Record<string, number>) {
  const debtors = Object.entries(balance)
    .filter(([, n]) => n < 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, n]) => ({ id, n: -n }));
  const creditors = Object.entries(balance)
    .filter(([, n]) => n > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, n]) => ({ id, n }));
  const result: { from: string; to: string; amountCents: number }[] = [];
  for (const d of debtors)
    for (const c of creditors) {
      const amountCents = Math.min(d.n, c.n);
      if (amountCents) {
        result.push({ from: d.id, to: c.id, amountCents });
        d.n -= amountCents;
        c.n -= amountCents;
      }
    }
  return result;
}

/** Budget math counts full household expenses, never inter-member repayments. */
export function monthlySummary(entries: GroupEntry[], month: string, memberId: string) {
  const result = {
    spendingCents: 0,
    incomeCents: 0,
    yourShareCents: 0,
    categorySpending: {} as Record<string, number>,
  };
  for (const e of entries) {
    if (e.voidedAt || !e.occurredOn.startsWith(month)) continue;
    if (e.kind === "income") {
      result.incomeCents += e.amountCents;
      continue;
    }
    const spending = -e.amountCents;
    result.spendingCents += spending;
    const category = e.categoryId ?? "uncategorized";
    result.categorySpending[category] = (result.categorySpending[category] ?? 0) + spending;
    result.yourShareCents +=
      (e.kind === "refund" ? -1 : 1) *
      (e.shares.find((s) => s.memberId === memberId)?.amountCents ?? 0);
  }
  return result;
}
