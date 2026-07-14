import { monthKeyLabel, monthKeyOf } from "@/lib/trends";
import type { RecurringItem, Transaction } from "@/lib/types";

export type RecurringMonthStatus = "upcoming" | "complete" | "unmatched";

export interface RecurringMonthRow {
  /** A recurring definition can create several occurrences in one month. */
  occurrenceId: string;
  recurringId: string;
  matchedTransactionId?: string;
  name: string;
  emoji: string;
  amountCents: number;
  isIncome: boolean;
  cadenceLabel: string;
  categoryId: string | null;
  dueDate: string;
  relativeLabel: string;
  status: RecurringMonthStatus;
}

export interface RecurringMonthSummary {
  monthKey: string;
  monthLabel: string;
  income: RecurringMonthProgress;
  expenses: RecurringMonthProgress;
  upcoming: RecurringMonthRow[];
  complete: RecurringMonthRow[];
  unmatched: RecurringMonthRow[];
}

export interface RecurringMonthProgress {
  totalCents: number;
  completedCents: number;
  remainingCents: number;
}

export interface ReconcileRecurringOptions {
  /** `YYYY-MM`, interpreted as a UTC calendar month like transaction reporting. */
  monthKey: string;
  /** Injectable so the due-status boundary is deterministic in tests. */
  now?: Date;
}

interface Occurrence {
  item: RecurringItem;
  dueDate: Date;
  dueDateKey: string;
}

interface MatchCandidate {
  occurrenceIndex: number;
  transactionIndex: number;
  nameScore: number;
  dateDistance: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const EARLY_PAYMENT_WINDOW_DAYS = 7;
const LATE_PAYMENT_WINDOW_DAYS = 3;

/** Expand the active schedule definitions into their actual due occurrences for
 *  one UTC month. Keeping occurrences separate is essential: a weekly bill has
 *  four or five independent chances to be reconciled and must not collapse
 *  into a single row or total. */
export function recurringOccurrencesForMonth(
  items: RecurringItem[],
  monthKey: string,
): Occurrence[] {
  const { year, monthIndex } = parseMonthKey(monthKey);
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0));
  const occurrences: Occurrence[] = [];

  for (const item of items) {
    if (item.paused) continue;

    if (item.cadence === "weekly") {
      const targetWeekday = normalizeWeekday(item.dayOfWeek);
      for (let day = 1; day <= end.getUTCDate(); day += 1) {
        const dueDate = new Date(Date.UTC(year, monthIndex, day));
        if (dueDate.getUTCDay() === targetWeekday) {
          occurrences.push(toOccurrence(item, dueDate));
        }
      }
      continue;
    }

    if (item.cadence === "yearly" && (item.monthOfYear ?? 1) !== monthIndex + 1) continue;
    occurrences.push(toOccurrence(item, dayOfMonthIn(year, monthIndex, item.dayOfMonth)));
  }

  return occurrences.sort(
    (a, b) => a.dueDate.getTime() - b.dueDate.getTime() || a.item.id.localeCompare(b.item.id),
  );
}

/** Reconcile a month's active recurring occurrences against loaded transactions.
 *  Matching is intentionally conservative: exact absolute amount, a strong
 *  normalized merchant-name match, and a narrow date window. Candidate edges
 *  are globally ordered so one transaction can never complete two occurrences. */
export function reconcileRecurring(
  items: RecurringItem[],
  transactions: Transaction[],
  { monthKey, now = new Date() }: ReconcileRecurringOptions,
): RecurringMonthSummary {
  const occurrences = recurringOccurrencesForMonth(items, monthKey);
  const monthTransactions = transactions.filter(
    (transaction) =>
      !transaction.excludeFromBudget && monthKeyOf(transaction.occurredAt) === monthKey,
  );
  const matches = matchOccurrences(occurrences, monthTransactions);
  const today = utcDay(now);
  const selectedIsCurrentMonth = monthKeyOf(now.toISOString()) === monthKey;
  const rows = occurrences.map((occurrence, index) => {
    const matchedTransaction = matches.get(index);
    const dueDateKey = occurrence.dueDateKey;
    const status: RecurringMonthStatus = matchedTransaction
      ? "complete"
      : selectedIsCurrentMonth && occurrence.dueDate > today
        ? "upcoming"
        : "unmatched";

    return {
      occurrenceId: `${occurrence.item.id}:${dueDateKey}`,
      recurringId: occurrence.item.id,
      matchedTransactionId: matchedTransaction?.id,
      name: occurrence.item.name,
      emoji: occurrence.item.emoji,
      amountCents: Math.abs(occurrence.item.amountCents),
      isIncome: occurrence.item.isIncome,
      cadenceLabel: occurrence.item.frequencyLabel,
      categoryId: occurrence.item.categoryId,
      dueDate: dueDateKey,
      relativeLabel: relativeDueLabel(occurrence.dueDate, today, selectedIsCurrentMonth),
      status,
    };
  });

  return {
    monthKey,
    monthLabel: monthKeyLabel(monthKey),
    income: progressFor(rows, true),
    expenses: progressFor(rows, false),
    upcoming: rows.filter((row) => row.status === "upcoming"),
    complete: rows.filter((row) => row.status === "complete"),
    unmatched: rows.filter((row) => row.status === "unmatched"),
  };
}

function matchOccurrences(
  occurrences: Occurrence[],
  transactions: Transaction[],
): Map<number, Transaction> {
  const candidates: MatchCandidate[] = [];
  occurrences.forEach((occurrence, occurrenceIndex) => {
    transactions.forEach((transaction, transactionIndex) => {
      if (occurrence.item.isIncome !== transaction.isIncome) return;
      if (Math.abs(occurrence.item.amountCents) !== Math.abs(transaction.amountCents)) return;

      const nameScore = strongNameMatchScore(occurrence.item.name, transaction.merchant);
      if (nameScore === 0) return;

      const dateDistance = Math.abs(
        dayDistance(occurrence.dueDate, new Date(transaction.occurredAt)),
      );
      const signedDistance = dayDistance(occurrence.dueDate, new Date(transaction.occurredAt));
      if (signedDistance < -EARLY_PAYMENT_WINDOW_DAYS || signedDistance > LATE_PAYMENT_WINDOW_DAYS)
        return;

      candidates.push({ occurrenceIndex, transactionIndex, nameScore, dateDistance });
    });
  });

  candidates.sort((a, b) => {
    if (b.nameScore !== a.nameScore) return b.nameScore - a.nameScore;
    if (a.dateDistance !== b.dateDistance) return a.dateDistance - b.dateDistance;
    const transactionOrder = transactions[a.transactionIndex].id.localeCompare(
      transactions[b.transactionIndex].id,
    );
    if (transactionOrder !== 0) return transactionOrder;
    return (
      occurrences[a.occurrenceIndex].dueDate.getTime() -
      occurrences[b.occurrenceIndex].dueDate.getTime()
    );
  });

  const usedOccurrences = new Set<number>();
  const usedTransactions = new Set<number>();
  const matches = new Map<number, Transaction>();
  for (const candidate of candidates) {
    if (
      usedOccurrences.has(candidate.occurrenceIndex) ||
      usedTransactions.has(candidate.transactionIndex)
    )
      continue;
    usedOccurrences.add(candidate.occurrenceIndex);
    usedTransactions.add(candidate.transactionIndex);
    matches.set(candidate.occurrenceIndex, transactions[candidate.transactionIndex]);
  }
  return matches;
}

function progressFor(rows: RecurringMonthRow[], isIncome: boolean): RecurringMonthProgress {
  const scoped = rows.filter((row) => row.isIncome === isIncome);
  const totalCents = scoped.reduce((sum, row) => sum + row.amountCents, 0);
  const completedCents = scoped
    .filter((row) => row.status === "complete")
    .reduce((sum, row) => sum + row.amountCents, 0);
  return { totalCents, completedCents, remainingCents: totalCents - completedCents };
}

/** Exact strings and meaningful prefix/suffix variants (e.g. "Netflix" and
 *  "NETFLIX.COM") are considered strong. Token overlap alone is deliberately
 *  rejected because it would produce more harmful false-positive matches. */
function strongNameMatchScore(recurringName: string, merchant: string): number {
  const recurring = normalizedName(recurringName);
  const transaction = normalizedName(merchant);
  if (!recurring || !transaction) return 0;
  if (recurring === transaction) return 2;
  return recurring.length >= 3 &&
    (transaction.includes(recurring) || recurring.includes(transaction))
    ? 1
    : 0;
}

function normalizedName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function parseMonthKey(monthKey: string): { year: number; monthIndex: number } {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(monthKey);
  if (!match) throw new Error(`Invalid month key: ${monthKey}`);
  return { year: Number(match[1]), monthIndex: Number(match[2]) - 1 };
}

function normalizeWeekday(dayOfWeek: number | null): number {
  return (((dayOfWeek ?? 0) % 7) + 7) % 7;
}

function dayOfMonthIn(year: number, monthIndex: number, requestedDay: number): Date {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, monthIndex, Math.min(Math.max(requestedDay, 1), lastDay)));
}

function toOccurrence(item: RecurringItem, dueDate: Date): Occurrence {
  return { item, dueDate, dueDateKey: dueDate.toISOString().slice(0, 10) };
}

function utcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayDistance(from: Date, to: Date): number {
  return Math.round((utcDay(to).getTime() - utcDay(from).getTime()) / DAY_MS);
}

function relativeDueLabel(dueDate: Date, today: Date, selectedIsCurrentMonth: boolean): string {
  if (!selectedIsCurrentMonth) {
    return dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  }
  const distance = dayDistance(today, dueDate);
  if (distance === 0) return "Today";
  if (distance === 1) return "Tomorrow";
  if (distance > 1) return `in ${distance} days`;
  if (distance === -1) return "Yesterday";
  return `${Math.abs(distance)} days ago`;
}
