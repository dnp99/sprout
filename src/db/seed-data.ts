/**
 * Realistic seed dataset for the test user, anchored to "now" at seed time.
 *
 * Transactions carry `daysAgo` + `hour` offsets (not fixed dates) so the seed is
 * always current-month, month-to-date activity: income at the start of the
 * month, rent + utilities, and everyday spending spread across the last few
 * days. Budgets are set so the computed summary (budget − spent, income − spent)
 * comes out coherent. Money is signed integer cents.
 */

export interface SeedCategory {
  id: string;
  name: string;
  emoji: string;
  color: string;
  monthlyBudgetCents: number;
}

export interface SeedTxn {
  categoryId: string | null;
  merchant: string;
  amountCents: number;
  /** Whole days before today (0 = today). Keeps rows in the current month. */
  daysAgo: number;
  /** Hour of day, for stable intra-day ordering. */
  hour: number;
  note: string;
  method: string;
}

export const seedCategories: SeedCategory[] = [
  { id: "bills", name: "Bills & rent", emoji: "🏠", color: "#d97a54", monthlyBudgetCents: 240000 },
  { id: "groceries", name: "Groceries", emoji: "🛒", color: "#c98a5a", monthlyBudgetCents: 60000 },
  { id: "dining", name: "Dining out", emoji: "🍽️", color: "#7e9b6b", monthlyBudgetCents: 35000 },
  { id: "shopping", name: "Shopping", emoji: "🛍️", color: "#c25b3a", monthlyBudgetCents: 30000 },
  { id: "transport", name: "Transport", emoji: "🚗", color: "#e7a34a", monthlyBudgetCents: 25000 },
  { id: "fun", name: "Fun", emoji: "🎬", color: "#9a7b5a", monthlyBudgetCents: 25000 },
];

// Budgets total $4,150. Month-to-date spend ~$2,709, income $4,500 → a healthy
// "doing great this month" state (safe-to-spend ~$1,441, saved ~$1,791).
export const seedTransactions: SeedTxn[] = [
  income("Salary", 450000, 4, 0, "Direct deposit", "Monthly paycheck"),

  expense("bills", "Rent", 185000, 4, 8, "Bank transfer", "Monthly rent"),
  expense("bills", "Comcast", 6500, 4, 9, "Visa •• 4291", "Internet"),
  expense("bills", "Verizon", 5500, 3, 10, "Visa •• 4291", "Phone plan"),
  expense("bills", "PG&E", 11240, 1, 9, "Visa •• 4291", "Electric bill"),

  expense("groceries", "Whole Foods", 8420, 4, 18, "Visa •• 4291", "Weekly grocery run"),
  expense("groceries", "Trader Joe's", 5210, 2, 17, "Visa •• 4291", "Grocery top-up"),
  expense("groceries", "Safeway", 6130, 0, 10, "Apple Pay", "Groceries"),

  expense("dining", "Blue Bottle", 650, 3, 8, "Apple Pay", "Morning coffee"),
  expense("dining", "Chipotle", 1420, 2, 12, "Apple Pay", "Lunch"),
  expense("dining", "Blue Bottle", 575, 1, 8, "Apple Pay", "Morning coffee"),
  expense("dining", "Sushi Nozomi", 8800, 0, 20, "Amex •• 1007", "Date night"),

  expense("transport", "Shell", 5200, 3, 17, "Visa •• 4291", "Gas fill-up"),
  expense("transport", "BART", 850, 2, 9, "Apple Pay", "Commute"),
  expense("transport", "Uber", 1840, 1, 19, "Apple Pay", "Ride home"),

  expense("fun", "Spotify", 1199, 4, 6, "Visa •• 4291", "Premium subscription"),
  expense("fun", "Netflix", 1599, 2, 7, "Visa •• 4291", "Subscription"),
  expense("fun", "AMC Theatres", 3400, 0, 21, "Visa •• 4291", "Movie night"),

  expense("shopping", "Amazon", 7830, 1, 13, "Visa •• 4291", "Household order"),
  expense("shopping", "Zara", 9500, 0, 14, "Visa •• 4291", "New jacket"),
];

function expense(
  categoryId: string,
  merchant: string,
  magnitudeCents: number,
  daysAgo: number,
  hour: number,
  method: string,
  note: string,
): SeedTxn {
  return { categoryId, merchant, amountCents: -magnitudeCents, daysAgo, hour, method, note };
}

function income(
  merchant: string,
  amountCents: number,
  daysAgo: number,
  hour: number,
  method: string,
  note: string,
): SeedTxn {
  return { categoryId: null, merchant, amountCents, daysAgo, hour, method, note };
}
