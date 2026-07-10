/** Small tokenized app previews for the landing's "The App" showcase tiles.
 *  Pure markup, no data. (The hero uses real screenshots, not a mock.) */

const CATS: [string, string, number, string][] = [
  ["🛒", "Groceries", 62, "$310"],
  ["🍽️", "Dining out", 45, "$180"],
  ["🏠", "Bills & rent", 88, "$1,540"],
  ["🛍️", "Shopping", 30, "$95"],
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

/** Mini "Overview" screen: safe-to-spend tile + two stat cells. */
export function MiniOverview() {
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="rounded-[10px] bg-primary p-2.5 text-onprimary">
        <div className="text-[8px] font-semibold uppercase tracking-[.12em] opacity-80">
          Safe to spend
        </div>
        <div className="mt-0.5 text-[18px] font-bold tabular-nums">$1,840</div>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-2">
        <div className="rounded-[8px] border border-edge p-2 text-[9px] font-semibold text-muted">
          Spent<div className="mt-0.5 text-[12px] font-bold text-ink">$1,160</div>
        </div>
        <div className="rounded-[8px] border border-edge p-2 text-[9px] font-semibold text-muted">
          Saved<div className="mt-0.5 text-[12px] font-bold text-green">$3,840</div>
        </div>
      </div>
    </div>
  );
}

/** Mini "Budget" screen: category allocation bars. */
export function MiniBudget() {
  return (
    <div className="flex h-full flex-col justify-center gap-2.5">
      {CATS.slice(0, 4).map(([emoji, name, pct]) => (
        <div key={name} className="flex items-center gap-1.5">
          <span className="text-[10px]">{emoji}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-track">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Mini "Trends" screen: a simple bar chart. */
export function MiniTrends() {
  const bars = [40, 62, 48, 75, 58, 88];
  return (
    <div className="flex h-full items-end gap-1.5">
      {bars.map((h, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t-[3px] ${i === bars.length - 1 ? "bg-primary" : "bg-track"}`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}
