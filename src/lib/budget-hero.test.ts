import { describe, expect, it } from "vitest";
import { buildBudgetHero, type BudgetHeroSummary } from "./budget-hero";
import type { RecurringItem } from "./types";

// July 2026 has 31 days. "now" = the 16th → 15 days left, 16 elapsed.
const NOW = new Date(2026, 6, 16, 12);

function summary(o: Partial<BudgetHeroSummary> = {}): BudgetHeroSummary {
  const budgetCents = o.budgetCents ?? 500100;
  const spentCents = o.spentCents ?? 4298;
  const incomeCents = o.incomeCents ?? 0;
  return {
    daysLeft: 15,
    budgetCents,
    spentCents,
    incomeCents,
    safeToSpendCents: o.safeToSpendCents ?? Math.max(0, budgetCents - spentCents),
    savedCents: o.savedCents ?? incomeCents - spentCents,
    ...o,
  };
}

function income(o: Partial<RecurringItem>): RecurringItem {
  return {
    id: "r1",
    name: "Salary",
    emoji: "💰",
    amountCents: 320000,
    cadence: "monthly",
    dayOfMonth: 18,
    dayOfWeek: null,
    monthOfYear: null,
    categoryId: null,
    frequencyLabel: "Monthly · 18th",
    paused: false,
    isIncome: true,
    ...o,
  };
}

describe("buildBudgetHero", () => {
  it("on-track: green coach, primary ring, headline is safe-to-spend", () => {
    const m = buildBudgetHero(summary(), [], NOW);
    expect(m.hasBudget).toBe(true);
    expect(m.monthLabel).toBe("July 2026");
    expect(m.headlineLabelKey).toBe("yoursToSpend");
    expect(m.headlineValue).toBe("$4,958.02");
    expect(m.ringArcTone).toBe("primary");
    expect(m.ringValue).toBe("$42.98");
    expect(m.ringSub).toEqual({ key: "ringOfAmount", params: { budget: "$5,001" } });
    expect(m.coach.tone).toBe("green");
    expect(m.coach.pill.key).toBe("pillGreat");
    // Linear projection: 42.98 × 31 / 16 ≈ $83, rounded to whole dollars.
    expect(m.coach.sentence).toEqual({ key: "coachGreat", params: { projected: "$83" } });
    expect(m.footerRight.labelKey).toBe("netThisMonth");
    expect(m.footerRight.shortLabelKey).toBe("net");
    expect(m.footerRight.value).toBe("−$42.98");
    expect(m.payday).toBeNull();
  });

  it("formats money + month label in fr-CA when asked", () => {
    const m = buildBudgetHero(summary(), [], NOW, "fr-CA");
    expect(m.monthLabel).toBe("juillet 2026");
    // NBSP variants normalized for the assertion.
    expect(m.headlineValue.replace(/[  ]/g, " ")).toBe("4 958,02 $");
  });

  it("uses neutral guidance instead of praising a month with no spending", () => {
    const m = buildBudgetHero(
      summary({ spentCents: 0, safeToSpendCents: 500100, savedCents: 0 }),
      [],
      NOW,
    );
    expect(m.coach.tone).toBe("muted");
    expect(m.coach.pill).toEqual({ key: "pillNoSpending" });
    expect(m.coach.sentence).toEqual({ key: "coachNoSpending" });
  });

  it("trending over: nudges (not cheers) when the pace lands over budget", () => {
    // 54% used by day 16 → projects ~$5,248, over the $5,000 pool.
    const m = buildBudgetHero(summary({ spentCents: 270863, safeToSpendCents: 229137 }), [], NOW);
    expect(m.usedPct).toBe(54);
    expect(m.coach.tone).toBe("primary");
    expect(m.coach.pill.key).toBe("pillAhead");
    expect(m.coach.sentence.params).toEqual({ projected: "$5,248", daily: "$153" });
  });

  it("near limit: primary coach when ≥85% of the pool is used", () => {
    const m = buildBudgetHero(summary({ spentCents: 462000, safeToSpendCents: 38100 }), [], NOW);
    expect(m.usedPct).toBe(92);
    expect(m.coach.pill.key).toBe("pillNear");
    expect(m.coach.tone).toBe("primary");
    expect(m.ringArcTone).toBe("primary");
  });

  it("over budget: primary-dark, ring shows a percent, net is negative", () => {
    const m = buildBudgetHero(
      summary({ spentCents: 564000, safeToSpendCents: 0, savedCents: -564000 }),
      [],
      NOW,
    );
    expect(m.headlineLabelKey).toBe("overBudgetTitle");
    expect(m.headlineValue).toBe("$639"); // 5640 − 5001
    expect(m.headlineValueTone).toBe("primaryDark");
    expect(m.ringArcTone).toBe("primaryDark");
    expect(m.ringValue).toBe("113%");
    expect(m.ringSub.key).toBe("ringOfBudget");
    expect(m.coach.pill.key).toBe("pillOver");
    expect(m.footerRight.tone).toBe("primaryDark");
  });

  it("payday: banner + green coach + 'after payday' footer, income within window", () => {
    const m = buildBudgetHero(
      summary({ spentCents: 462000, safeToSpendCents: 38100 }),
      [income({ dayOfMonth: 18, amountCents: 320000 })],
      NOW,
    );
    expect(m.payday).not.toBeNull();
    expect(m.payday!.inDays).toBe(2); // 16th → 18th
    expect(m.payday!.weekdayShort).toBe("Sat"); // 2026-07-18 is a Saturday
    expect(m.payday!.title).toEqual({ key: "paydayTitle", params: { days: 2 } });
    expect(m.payday!.subtitle).toEqual({
      key: "paydaySubtitle",
      params: { name: "Salary", weekday: "Saturday" },
    });
    expect(m.payday!.amountLabel).toBe("+$3,200");
    expect(m.coach.pill.key).toBe("pillPayday");
    expect(m.footerLeft.labelKey).toBe("incomeSoFar");
    expect(m.footerRight.labelKey).toBe("afterPayday");
    expect(m.footerRight.value).toBe("$3,581"); // 381 + 3200
    expect(m.sub.key).toBe("subPayday");
  });

  it("payday is ignored when the paycheck is beyond the window", () => {
    const m = buildBudgetHero(summary(), [income({ dayOfMonth: 30 })], NOW);
    expect(m.payday).toBeNull();
  });

  it("over budget suppresses the payday overlay", () => {
    const m = buildBudgetHero(
      summary({ spentCents: 564000, safeToSpendCents: 0, savedCents: -564000 }),
      [income({ dayOfMonth: 18 })],
      NOW,
    );
    expect(m.payday).toBeNull();
    expect(m.headlineLabelKey).toBe("overBudgetTitle");
  });

  it("no budget: hasBudget false, onboarding footer cells", () => {
    const m = buildBudgetHero(summary({ budgetCents: 0, safeToSpendCents: 0 }), [], NOW);
    expect(m.hasBudget).toBe(false);
    expect(m.footerLeft.labelKey).toBe("spentSoFar");
    expect(m.footerRight.labelKey).toBe("income");
  });
});
