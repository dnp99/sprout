import type { RecurringItem, UpcomingBill } from "@/lib/types";

/** Recurring income & bills. Money in cents; negative = expense. */
export const mockRecurring: RecurringItem[] = [
  {
    id: "salary",
    name: "Salary",
    emoji: "💰",
    amountCents: 320000,
    frequencyLabel: "Monthly · 1st",
    paused: false,
    isIncome: true,
  },
  {
    id: "rent",
    name: "Rent",
    emoji: "🏠",
    amountCents: -185000,
    frequencyLabel: "Monthly · 1st",
    paused: false,
    isIncome: false,
  },
  {
    id: "electric",
    name: "Electric",
    emoji: "⚡",
    amountCents: -8800,
    frequencyLabel: "Monthly · 4th",
    paused: false,
    isIncome: false,
  },
  {
    id: "netflix",
    name: "Netflix",
    emoji: "🎬",
    amountCents: -1599,
    frequencyLabel: "Monthly · 7th",
    paused: false,
    isIncome: false,
  },
  {
    id: "spotify",
    name: "Spotify",
    emoji: "🎵",
    amountCents: -1199,
    frequencyLabel: "Monthly · 12th",
    paused: false,
    isIncome: false,
  },
  {
    id: "gym",
    name: "Gym",
    emoji: "🏋️",
    amountCents: -4000,
    frequencyLabel: "Monthly · 15th",
    paused: false,
    isIncome: false,
  },
  {
    id: "icloud",
    name: "iCloud+",
    emoji: "☁️",
    amountCents: -299,
    frequencyLabel: "Monthly · 20th",
    paused: false,
    isIncome: false,
  },
];

/** Bills due soon (Bills screen "Coming up"). */
export const mockUpcomingBills: UpcomingBill[] = [
  {
    id: "netflix",
    name: "Netflix",
    emoji: "🎬",
    dueLabel: "in 3 days",
    amountCents: 1599,
    urgent: true,
  },
  {
    id: "electric",
    name: "Electric",
    emoji: "⚡",
    dueLabel: "in 6 days",
    amountCents: 8800,
    urgent: false,
  },
  { id: "gym", name: "Gym", emoji: "🏋️", dueLabel: "in 9 days", amountCents: 4000, urgent: false },
];

/** Total due this month, in cents ($1,143.98). */
export const billsDueThisMonthCents = 114398;
