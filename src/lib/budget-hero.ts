import { formatMoney } from "./format";
import { daysUntil, nextDueDate } from "./bills";
import type { RecurringItem } from "./types";

/**
 * Budget-ring hero view-model (from the "Hero card — budget ring" design handoff).
 * Turns the month `summary` (+ recurring income, for payday) into everything the
 * shared `BudgetRingHero` renders, so web and mobile show identical numbers and
 * copy. Pure + unit-tested. Money in / out is integer cents; display strings are
 * pre-formatted here (including whole-dollar coach figures) so the component just
 * paints them.
 */

/** How full the pool must be (spent ÷ budget) before we switch to the calmer
 *  "getting close" voice. */
const NEAR_THRESHOLD_PCT = 85;
/** Show the payday banner when recurring income lands within this many days. */
const PAYDAY_WINDOW_DAYS = 5;

const WEEKDAYS_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Tone keys the component maps to design tokens. `ink`/`muted` are neutral. */
export type HeroTone = "green" | "primary" | "primaryDark" | "ink" | "muted";

export interface BudgetHeroSummary {
  monthLabel: string;
  daysLeft: number;
  budgetCents: number;
  spentCents: number;
  incomeCents: number;
  safeToSpendCents: number;
  /** income − spent (net this month). */
  savedCents: number;
}

/** A run of copy with one emphasized figure, so the component can bold just the
 *  number: `{lead}<b>{figure}</b>{tail}`. */
export interface HeroSentence {
  lead: string;
  figure: string;
  tail: string;
}

export interface HeroCoach extends HeroSentence {
  tone: HeroTone;
  pill: string;
}

export interface HeroFooterCell {
  label: string;
  /** Compact variant for the phone-width footer (e.g. "Net"); label otherwise. */
  shortLabel?: string;
  value: string;
  tone: HeroTone;
}

export interface PaydayInfo {
  inDays: number;
  /** "Fri". */
  weekdayShort: string;
  /** 18. */
  dayOfMonth: number;
  /** "Payday in 3 days". */
  title: string;
  /** "Salary lands Friday". */
  subtitle: string;
  /** "+$3,200". */
  amountLabel: string;
}

export interface BudgetHeroModel {
  monthLabel: string;
  daysLeft: number;
  hasBudget: boolean;

  /** Headline block. */
  headlineLabel: string;
  headlineLabelTone: HeroTone;
  headlineValue: string;
  headlineValueTone: HeroTone;
  sub: HeroSentence;

  /** Ring gauge. */
  usedPct: number;
  ringArcTone: "primary" | "primaryDark";
  ringValue: string;
  ringSub: string;
  ringUsedTone: HeroTone;

  coach: HeroCoach;

  footerLeft: HeroFooterCell;
  footerRight: HeroFooterCell;

  /** Present when a paycheck lands soon; adds the banner + swaps the footer. */
  payday: PaydayInfo | null;
}

/** Whole-dollar money string for coach / allowance figures ("$331", not
 *  "$331.47") — the design speaks in round numbers for these. */
function roundedMoney(cents: number): string {
  return formatMoney(Math.round(cents / 100) * 100);
}

/** The soonest active recurring income that lands within the payday window and
 *  before the month ends, or null. */
function findPayday(
  recurring: RecurringItem[],
  now: Date,
  daysLeft: number,
): { item: RecurringItem; date: Date; days: number } | null {
  let best: { item: RecurringItem; date: Date; days: number } | null = null;
  for (const item of recurring) {
    if (item.paused || !item.isIncome) continue;
    const date = nextDueDate(item, now);
    const days = daysUntil(date, now);
    if (days < 0 || days > PAYDAY_WINDOW_DAYS || days > daysLeft) continue;
    if (!best || days < best.days) best = { item, date, days };
  }
  return best;
}

export function buildBudgetHero(
  summary: BudgetHeroSummary,
  recurring: RecurringItem[] = [],
  now: Date = new Date(),
): BudgetHeroModel {
  const {
    monthLabel,
    daysLeft,
    budgetCents,
    spentCents,
    incomeCents,
    safeToSpendCents,
    savedCents,
  } = summary;

  const hasBudget = budgetCents > 0;
  const overBudget = spentCents > budgetCents;
  const usedPct = hasBudget ? Math.round((spentCents / budgetCents) * 100) : 0;
  const near = hasBudget && !overBudget && usedPct >= NEAR_THRESHOLD_PCT;
  const overspendCents = Math.max(0, spentCents - budgetCents);

  // Linear pace projection of this month's spend (spent so far scaled to a full
  // month), for the on-track "finishing near $X" coaching.
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysElapsed = Math.max(1, daysInMonth - daysLeft);
  const projectedSpendCents = Math.round((spentCents * daysInMonth) / daysElapsed);

  // Payday only layers onto a funded, not-over month (over is more urgent, and an
  // "after payday" figure would muddy it).
  const pay = hasBudget && !overBudget ? findPayday(recurring, now, daysLeft) : null;
  const payday: PaydayInfo | null = pay
    ? {
        inDays: pay.days,
        weekdayShort: WEEKDAYS_SHORT[pay.date.getDay()],
        dayOfMonth: pay.date.getDate(),
        title:
          pay.days === 0 ? "Payday today" : `Payday in ${pay.days} day${pay.days === 1 ? "" : "s"}`,
        subtitle: `${pay.item.name} lands ${WEEKDAYS_FULL[pay.date.getDay()]}`,
        amountLabel: formatMoney(Math.abs(pay.item.amountCents), { signed: true }),
      }
    : null;

  // Daily allowance denominator: days-to-payday when a paycheck is imminent, else
  // days left in the month.
  const allowanceDays = payday && payday.inDays > 0 ? payday.inDays : Math.max(1, daysLeft);
  const dailyAllowanceCents = Math.round(safeToSpendCents / allowanceDays);
  const recommendedDailyCents = Math.round(safeToSpendCents / Math.max(1, daysLeft));

  // Headline.
  const headlineLabel = overBudget ? "Over budget this month" : "Yours to spend";
  const headlineLabelTone: HeroTone = overBudget ? "primaryDark" : "muted";
  const headlineValue = overBudget ? formatMoney(overspendCents) : formatMoney(safeToSpendCents);
  const headlineValueTone: HeroTone = overBudget ? "primaryDark" : "ink";
  const sub: HeroSentence = overBudget
    ? {
        lead: "Spent ",
        figure: formatMoney(spentCents),
        tail: ` of your ${formatMoney(budgetCents)} pool.`,
      }
    : payday
      ? { lead: "About ", figure: roundedMoney(dailyAllowanceCents), tail: " a day until payday." }
      : {
          lead: "About ",
          figure: roundedMoney(dailyAllowanceCents),
          tail: ` a day for the next ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
        };

  // Ring gauge.
  const ringArcTone: "primary" | "primaryDark" = overBudget ? "primaryDark" : "primary";
  const ringValue = overBudget ? `${usedPct}%` : formatMoney(spentCents);
  const ringSub = overBudget ? "of budget" : `of ${formatMoney(budgetCents)}`;
  const ringUsedTone: HeroTone = overBudget ? "primaryDark" : "ink";

  // Coach — payday's reassuring voice overrides the base state.
  let coach: HeroCoach;
  if (payday) {
    coach = {
      tone: "green",
      pill: "Almost there — hang tight",
      lead: `Just ${payday.inDays} day${payday.inDays === 1 ? "" : "s"} to go — about `,
      figure: roundedMoney(dailyAllowanceCents),
      tail: " a day carries you comfortably to payday.",
    };
  } else if (overBudget) {
    coach = {
      tone: "primaryDark",
      pill: "A bit over — that's okay",
      lead: "You're ",
      figure: formatMoney(overspendCents),
      tail: " past your pool — ease off the extras and you'll pull it back.",
    };
  } else if (near) {
    coach = {
      tone: "primary",
      pill: "Getting close to your limit",
      lead: "You've used most of the pool — about ",
      figure: roundedMoney(recommendedDailyCents),
      tail: " a day keeps you comfortably inside.",
    };
  } else if (projectedSpendCents > budgetCents) {
    // Still have room today, but this pace lands over budget — nudge, don't cheer.
    coach = {
      tone: "primary",
      pill: "A little ahead of pace",
      lead: "At this rate you'll finish around ",
      figure: roundedMoney(projectedSpendCents),
      tail: `. About ${roundedMoney(recommendedDailyCents)}/day keeps you in budget.`,
    };
  } else {
    coach = {
      tone: "green",
      pill: "You're doing great",
      lead: "Pacing nicely — on track to finish around ",
      figure: roundedMoney(projectedSpendCents),
      tail: " this month.",
    };
  }

  // Footer. No-budget onboarding shows raw spent + income; funded months show
  // income + net (or income-so-far + after-payday when a paycheck is imminent).
  let footerLeft: HeroFooterCell;
  let footerRight: HeroFooterCell;
  if (!hasBudget) {
    footerLeft = { label: "Spent so far", value: formatMoney(spentCents), tone: "ink" };
    footerRight = { label: "Income", value: formatMoney(incomeCents), tone: "green" };
  } else if (payday) {
    footerLeft = { label: "Income so far", value: formatMoney(incomeCents), tone: "green" };
    footerRight = {
      label: "After payday",
      value: formatMoney(safeToSpendCents + Math.abs(pay!.item.amountCents)),
      tone: "ink",
    };
  } else {
    footerLeft = { label: "Income", value: formatMoney(incomeCents), tone: "green" };
    footerRight = {
      label: "Net this month",
      shortLabel: "Net",
      value: formatMoney(savedCents, { signed: true }),
      tone: overBudget ? "primaryDark" : "muted",
    };
  }

  return {
    monthLabel,
    daysLeft,
    hasBudget,
    headlineLabel,
    headlineLabelTone,
    headlineValue,
    headlineValueTone,
    sub,
    usedPct,
    ringArcTone,
    ringValue,
    ringSub,
    ringUsedTone,
    coach,
    footerLeft,
    footerRight,
    payday,
  };
}
