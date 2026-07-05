import type { ConnectedAccount, DonutSegment, TopMover, TrendPoint } from "@/lib/types";

/** Fixed "By category" donut ring from the design. */
export const spendingDonutSegments: DonutSegment[] = [
  { color: "#d97a54", pct: 30 },
  { color: "#e7a34a", pct: 16 },
  { color: "#7e9b6b", pct: 16 },
  { color: "#c98a5a", pct: 20 },
  { color: "#e6d2b8", pct: 18 },
];

/** Connected bank/card accounts (web Settings). */
export const mockAccounts: ConnectedAccount[] = [
  {
    id: "chase",
    name: "Chase Checking",
    emoji: "🏦",
    last4: "4291",
    syncedLabel: "Synced 2h ago",
    status: "Connected",
  },
  {
    id: "amex",
    name: "Amex Gold",
    emoji: "💳",
    last4: "1007",
    syncedLabel: "Synced 2h ago",
    status: "Connected",
  },
];

/** 6-month spending trend; heights are % of the tallest bar. June is current. */
export const mockTrend: TrendPoint[] = [
  { label: "Jan", heightPercent: 52 },
  { label: "Feb", heightPercent: 70 },
  { label: "Mar", heightPercent: 58 },
  { label: "Apr", heightPercent: 86 },
  { label: "May", heightPercent: 76 },
  { label: "Jun", heightPercent: 64, current: true },
];

/** Biggest category changes vs last month (cents). */
export const mockTopMovers: TopMover[] = [
  { name: "Shopping", emoji: "🛍️", deltaCents: 12000 },
  { name: "Dining out", emoji: "🍽️", deltaCents: -6000 },
  { name: "Transport", emoji: "🚗", deltaCents: -3000 },
];
