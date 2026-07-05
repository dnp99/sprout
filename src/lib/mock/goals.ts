import type { Goal } from "@/lib/types";

export const mockGoals: Goal[] = [
  {
    id: "japan",
    name: "Japan trip",
    emoji: "🌸",
    savedCents: 210000,
    targetCents: 500000,
    targetLabel: "Dec 2026",
    color: "#e7a34a",
  },
  {
    id: "safety",
    name: "Safety net",
    emoji: "🛡️",
    savedCents: 840000,
    targetCents: 1000000,
    targetLabel: "Almost there!",
    color: "#7e9b6b",
  },
  {
    id: "laptop",
    name: "New laptop",
    emoji: "💻",
    savedCents: 122000,
    targetCents: 200000,
    targetLabel: "Sep 2026",
    color: "#d97a54",
  },
];
