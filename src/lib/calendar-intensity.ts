/** Ordinal thirds preserve useful variation even when one day is an outlier.
 * Only positive daily spending in the visible reporting period participates;
 * credits, zeroes and missing days never acquire spending intensity. */
export function calendarSpendingIntensity(values: readonly number[]) {
  const positive = [...new Set(values.filter((value) => isFinite(value) && value > 0))].sort(
    (a, b) => a - b,
  );
  return new Map(
    positive.map((value, index) => [
      value,
      positive.length === 1 ? 1 : 1 + Math.round((index * 2) / (positive.length - 1)),
    ]),
  );
}
