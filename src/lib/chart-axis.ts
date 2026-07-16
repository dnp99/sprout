export interface MoneyAxisTick {
  value: number;
  label: string;
}

function compactMoney(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) {
    const rounded =
      dollars >= 10000 ? Math.round(dollars / 1000) : Math.round((dollars / 1000) * 10) / 10;
    return `$${rounded}K`;
  }
  return `$${Math.round(dollars)}`;
}

function niceCeiling(value: number): number {
  if (value <= 0) return 1000;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  if (normalized <= 1) return magnitude;
  if (normalized <= 1.5) return 1.5 * magnitude;
  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 3) return 3 * magnitude;
  if (normalized <= 4) return 4 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

/** Build a compact currency axis whose top tick is also the chart's scale max. */
export function buildMoneyAxis(
  maxCents: number,
  intervals = 4,
): {
  maxCents: number;
  ticks: MoneyAxisTick[];
} {
  const ceiling = niceCeiling(maxCents);
  const ticks = Array.from({ length: intervals + 1 }, (_, index) => index / intervals).map(
    (ratio) => {
      const value = Math.round(ceiling * ratio);
      return { value, label: compactMoney(value) };
    },
  );
  return { maxCents: ceiling, ticks };
}
