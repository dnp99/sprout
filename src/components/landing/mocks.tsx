/** Small tokenized app previews for the landing's "The App" showcase tiles.
 *  Pure markup, no data. (The hero uses real screenshots, not a mock.) Each
 *  tile shows a *different* widget so the three don't look duplicated. */

/** Category rows (emoji, name, % of budget, amount) — the Budget tile. */
const CATS: [string, string, number, string][] = [
  ["🛒", "Groceries", 62, "$310"],
  ["🍽️", "Dining out", 45, "$180"],
  ["🏠", "Bills & rent", 88, "$1,540"],
  ["🛍️", "Shopping", 30, "$95"],
];

/** Repeat merchants (emoji, name, meta) — the Overview tile's Frequent spots. */
const SPOTS: [string, string, string][] = [
  ["☕", "Blue Bottle", "5 visits"],
  ["🛒", "Whole Foods", "4 visits"],
  ["🍔", "Shake Shack", "2 visits"],
];

/** A small labelled app-screen tile for the "Everything in one calm place" row. */
export function MiniAppTile({
  title,
  caption,
  children,
}: {
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="aspect-[4/3] overflow-hidden rounded-[14px] border border-edge bg-card p-3">
        {children}
      </div>
      <div className="mt-3 text-[14px] font-bold text-ink">{title}</div>
      <div className="mt-0.5 text-[12.5px] font-medium text-muted">{caption}</div>
    </div>
  );
}

/** Mini "Overview" screen: safe-to-spend tile, stat cells, and Frequent spots
 *  (repeat merchants) — distinct from the Budget tile's category bars. */
export function MiniOverview() {
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="rounded-[10px] bg-primary p-2.5 text-onprimary">
        <div className="text-[8px] font-semibold uppercase tracking-[.12em] opacity-80">
          Safe to spend
        </div>
        <div className="mt-0.5 text-[18px] font-bold tabular-nums">$1,840</div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[8px] border border-edge px-2 py-1.5 text-[9px] font-semibold text-muted">
          Spent<div className="mt-0.5 text-[12px] font-bold text-ink">$1,160</div>
        </div>
        <div className="rounded-[8px] border border-edge px-2 py-1.5 text-[9px] font-semibold text-muted">
          Saved<div className="mt-0.5 text-[12px] font-bold text-green">$3,840</div>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1.5 rounded-[8px] border border-edge px-2.5 py-2">
        <div className="text-[7.5px] font-semibold uppercase tracking-[.1em] text-muted">
          Frequent spots
        </div>
        {SPOTS.map(([emoji, name, meta]) => (
          <div key={name} className="flex items-center gap-1.5">
            <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-track text-[8px]">
              {emoji}
            </span>
            <span className="min-w-0 flex-1 truncate text-[9px] font-semibold text-ink">
              {name}
            </span>
            <span className="text-[8px] font-medium text-muted">{meta}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mini "Budget" screen: category allocation rows (name, amount, progress). */
export function MiniBudget() {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {CATS.map(([emoji, name, pct, amt]) => (
        <div key={name}>
          <div className="flex items-center justify-between text-[9px] font-semibold">
            <span className="flex items-center gap-1 text-ink">
              <span className="text-[10px] leading-none">{emoji}</span>
              {name}
            </span>
            <span className="tabular-nums text-muted">{amt}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-track">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Mini "Trends" screen: monthly spending vs. a budget reference line, with the
 *  current month highlighted and a pace figure — a real spending-trend widget. */
export function MiniTrends() {
  const bars: [string, number][] = [
    ["F", 40],
    ["M", 62],
    ["A", 48],
    ["M", 75],
    ["J", 58],
    ["J", 88],
  ];
  const budget = 68; // height (%) of the dashed budget reference line
  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[7.5px] font-semibold uppercase tracking-[.1em] text-muted">
          Spending trend
        </span>
        <span className="text-[8px] font-medium text-muted">
          on pace for <span className="font-bold text-ink tabular-nums">$2,140</span>
        </span>
      </div>
      <div className="relative flex flex-1 items-end gap-1.5">
        {/* budget reference line */}
        <div className="pointer-events-none absolute inset-x-0" style={{ bottom: `${budget}%` }}>
          <div className="border-t border-dashed border-muted/50" />
          <span className="absolute -top-[7px] right-0 bg-card px-0.5 text-[6px] font-semibold text-muted">
            Budget
          </span>
        </div>
        {bars.map(([, h], i) => (
          <div
            key={i}
            className={`flex-1 rounded-t-[3px] ${i === bars.length - 1 ? "bg-primary" : "bg-track"}`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {bars.map(([label], i) => (
          <span
            key={i}
            className={`flex-1 text-center text-[7px] font-semibold ${
              i === bars.length - 1 ? "text-primary" : "text-muted"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
