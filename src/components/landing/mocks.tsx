/** Tokenized app previews for the landing page — a full dashboard mock for the
 *  hero and small tiles for the "The App" showcase. Pure markup, no data. */

const NAV = ["Overview", "Budget", "Trends", "Goals", "Bills", "Import"];
const CATS: [string, string, number, string][] = [
  ["🛒", "Groceries", 62, "$310"],
  ["🍽️", "Dining out", 45, "$180"],
  ["🏠", "Bills & rent", 88, "$1,540"],
  ["🛍️", "Shopping", 30, "$95"],
];

/** The hero's app-dashboard preview: sidebar rail + Overview content. */
export function DashboardMock() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-edge bg-card shadow-2xl">
      <div className="flex">
        {/* Sidebar rail */}
        <div className="hidden w-[150px] flex-none flex-col gap-1 border-r border-edge bg-sidebar p-3 sm:flex">
          <div className="px-2 pb-2 text-[13px] font-bold text-primary">🌱 Sprout</div>
          {NAV.map((n, i) => (
            <div
              key={n}
              className={`rounded-[8px] px-2.5 py-1.5 text-[11.5px] font-semibold ${
                i === 0 ? "bg-primary-soft text-primary" : "text-muted"
              }`}
            >
              {n}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-bold text-ink">Overview</span>
            <span className="rounded-[8px] border border-edge px-2 py-1 text-[10px] font-semibold text-muted">
              July 2026
            </span>
          </div>

          {/* Stat row */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-[10px] bg-primary p-2.5 text-onprimary">
              <div className="text-[8.5px] font-semibold uppercase tracking-[.12em] opacity-80">
                Safe to spend
              </div>
              <div className="mt-0.5 text-[17px] font-bold tabular-nums">$1,840</div>
            </div>
            <Stat label="Spent" value="$1,160" />
            <Stat label="Income" value="$5,000" green />
          </div>

          {/* Category bars */}
          <div className="mt-3 rounded-[10px] border border-edge p-2.5">
            <div className="text-[9.5px] font-semibold uppercase tracking-[.1em] text-muted">
              By category
            </div>
            <div className="mt-2 flex flex-col gap-2">
              {CATS.map(([emoji, name, pct, amt]) => (
                <div key={name} className="flex items-center gap-2">
                  <span className="text-[12px]">{emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between text-[9.5px] font-semibold">
                      <span className="text-ink">{name}</span>
                      <span className="tabular-nums text-muted">{amt}</span>
                    </div>
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-track">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent transaction */}
          <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-edge px-2.5 py-2">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-track text-[12px]">
              ☕
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[10.5px] font-semibold text-ink">Blue Bottle</div>
              <div className="text-[8.5px] font-medium text-muted">Dining out · via Siri</div>
            </div>
            <span className="text-[10.5px] font-bold tabular-nums text-ink">−$4.50</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, green = false }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="rounded-[10px] border border-edge p-2.5">
      <div className="text-[8.5px] font-semibold uppercase tracking-[.12em] text-muted">
        {label}
      </div>
      <div
        className={`mt-0.5 text-[17px] font-bold tabular-nums ${green ? "text-green" : "text-ink"}`}
      >
        {value}
      </div>
    </div>
  );
}

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
