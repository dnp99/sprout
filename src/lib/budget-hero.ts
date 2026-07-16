import { formatMoney, formatMonthYear, formatWeekday } from "./format";
import { DEFAULT_LOCALE, type AppLocale } from "./locale";
import { daysUntil, nextDueDate } from "./bills";
import type { RecurringItem } from "./types";

/**
 * Budget-ring hero view-model (from the "Hero card — budget ring" design handoff).
 * Turns the month `summary` (+ recurring income, for payday) into everything the
 * shared `BudgetRingHero` renders. Copy is returned as message **descriptors**
 * ({ key, params } into the `hero` catalog namespace) rather than English
 * sentences, so the component translates at the edge and this stays pure and
 * unit-testable (plan 013 §D). Money params are pre-formatted display strings in
 * the given locale; storage is CAD cents throughout.
 */

/** How full the pool must be (spent ÷ budget) before we switch to the calmer
 *  "getting close" voice. */
const NEAR_THRESHOLD_PCT = 85;
/** Show the payday banner when recurring income lands within this many days. */
const PAYDAY_WINDOW_DAYS = 5;

/** Tone keys the component maps to design tokens. `ink`/`muted` are neutral. */
export type HeroTone = "green" | "primary" | "primaryDark" | "ink" | "muted";

export interface BudgetHeroSummary {
  daysLeft: number;
  budgetCents: number;
  spentCents: number;
  incomeCents: number;
  safeToSpendCents: number;
  /** income − spent (net this month). */
  savedCents: number;
}

/** A translatable run of copy: a key in the `hero` namespace plus its ICU
 *  params. Emphasized figures use rich-text `<b>` chunks in the message. */
export interface HeroMessage {
  key: string;
  params?: Record<string, string | number>;
}

export interface HeroCoach {
  tone: HeroTone;
  pill: HeroMessage;
  sentence: HeroMessage;
}

export interface HeroFooterCell {
  labelKey: string;
  /** Compact label for the phone-width footer; labelKey otherwise. */
  shortLabelKey?: string;
  value: string;
  tone: HeroTone;
}

export interface PaydayInfo {
  inDays: number;
  /** "Fri". */
  weekdayShort: string;
  /** 18. */
  dayOfMonth: number;
  /** "Payday in 3 days" / "Payday today". */
  title: HeroMessage;
  /** "Salary lands Friday". */
  subtitle: HeroMessage;
  /** "+$3,200". */
  amountLabel: string;
}

export interface BudgetHeroModel {
  monthLabel: string;
  daysLeft: number;
  hasBudget: boolean;

  /** Headline block. */
  headlineLabelKey: string;
  headlineLabelTone: HeroTone;
  headlineValue: string;
  headlineValueTone: HeroTone;
  sub: HeroMessage;

  /** Ring gauge. */
  usedPct: number;
  ringArcTone: "primary" | "primaryDark";
  ringValue: string;
  ringSub: HeroMessage;
  ringUsedTone: HeroTone;

  coach: HeroCoach;

  footerLeft: HeroFooterCell;
  footerRight: HeroFooterCell;

  /** Present when a paycheck lands soon; adds the banner + swaps the footer. */
  payday: PaydayInfo | null;
}

/** Whole-dollar money string for coach / allowance figures ("$331", not
 *  "$331.47") — the design speaks in round numbers for these. */
function roundedMoney(cents: number, locale: AppLocale): string {
  return formatMoney(Math.round(cents / 100) * 100, { locale });
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
  locale: AppLocale = DEFAULT_LOCALE,
): BudgetHeroModel {
  const { daysLeft, budgetCents, spentCents, incomeCents, safeToSpendCents, savedCents } = summary;
  const money = (cents: number, opts: { signed?: boolean } = {}) =>
    formatMoney(cents, { ...opts, locale });

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
        weekdayShort: formatWeekday(pay.date, "short", locale),
        dayOfMonth: pay.date.getDate(),
        title: { key: "paydayTitle", params: { days: pay.days } },
        subtitle: {
          key: "paydaySubtitle",
          params: { name: pay.item.name, weekday: formatWeekday(pay.date, "long", locale) },
        },
        amountLabel: money(Math.abs(pay.item.amountCents), { signed: true }),
      }
    : null;

  // Daily allowance denominator: days-to-payday when a paycheck is imminent, else
  // days left in the month.
  const allowanceDays = payday && payday.inDays > 0 ? payday.inDays : Math.max(1, daysLeft);
  const dailyAllowance = roundedMoney(Math.round(safeToSpendCents / allowanceDays), locale);
  const recommendedDaily = roundedMoney(
    Math.round(safeToSpendCents / Math.max(1, daysLeft)),
    locale,
  );

  // Headline.
  const headlineLabelKey = overBudget ? "overBudgetTitle" : "yoursToSpend";
  const headlineLabelTone: HeroTone = overBudget ? "primaryDark" : "muted";
  const headlineValue = overBudget ? money(overspendCents) : money(safeToSpendCents);
  const headlineValueTone: HeroTone = overBudget ? "primaryDark" : "ink";
  const sub: HeroMessage = overBudget
    ? { key: "subOver", params: { spent: money(spentCents), budget: money(budgetCents) } }
    : payday
      ? { key: "subPayday", params: { daily: dailyAllowance } }
      : { key: "subDefault", params: { daily: dailyAllowance, days: daysLeft } };

  // Ring gauge.
  const ringArcTone: "primary" | "primaryDark" = overBudget ? "primaryDark" : "primary";
  const ringValue = overBudget ? `${usedPct}%` : money(spentCents);
  const ringSub: HeroMessage = overBudget
    ? { key: "ringOfBudget" }
    : { key: "ringOfAmount", params: { budget: money(budgetCents) } };
  const ringUsedTone: HeroTone = overBudget ? "primaryDark" : "ink";

  // Coach — payday's reassuring voice overrides the base state; a pace that
  // lands over budget nudges instead of cheering.
  let coach: HeroCoach;
  if (payday) {
    coach = {
      tone: "green",
      pill: { key: "pillPayday" },
      sentence: { key: "coachPayday", params: { days: payday.inDays, daily: dailyAllowance } },
    };
  } else if (overBudget) {
    coach = {
      tone: "primaryDark",
      pill: { key: "pillOver" },
      sentence: { key: "coachOver", params: { over: money(overspendCents) } },
    };
  } else if (near) {
    coach = {
      tone: "primary",
      pill: { key: "pillNear" },
      sentence: { key: "coachNear", params: { daily: recommendedDaily } },
    };
  } else if (projectedSpendCents > budgetCents) {
    coach = {
      tone: "primary",
      pill: { key: "pillAhead" },
      sentence: {
        key: "coachAhead",
        params: { projected: roundedMoney(projectedSpendCents, locale), daily: recommendedDaily },
      },
    };
  } else {
    coach = {
      tone: "green",
      pill: { key: "pillGreat" },
      sentence: {
        key: "coachGreat",
        params: { projected: roundedMoney(projectedSpendCents, locale) },
      },
    };
  }

  // Footer. No-budget onboarding shows raw spent + income; funded months show
  // income + net (or income-so-far + after-payday when a paycheck is imminent).
  let footerLeft: HeroFooterCell;
  let footerRight: HeroFooterCell;
  if (!hasBudget) {
    footerLeft = { labelKey: "spentSoFar", value: money(spentCents), tone: "ink" };
    footerRight = { labelKey: "income", value: money(incomeCents), tone: "green" };
  } else if (payday) {
    footerLeft = { labelKey: "incomeSoFar", value: money(incomeCents), tone: "green" };
    footerRight = {
      labelKey: "afterPayday",
      value: money(safeToSpendCents + Math.abs(pay!.item.amountCents)),
      tone: "ink",
    };
  } else {
    footerLeft = { labelKey: "income", value: money(incomeCents), tone: "green" };
    footerRight = {
      labelKey: "netThisMonth",
      shortLabelKey: "net",
      value: money(savedCents, { signed: true }),
      tone: overBudget ? "primaryDark" : "muted",
    };
  }

  return {
    monthLabel: formatMonthYear(now, locale),
    daysLeft,
    hasBudget,
    headlineLabelKey,
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
