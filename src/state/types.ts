import type {
  BacklogResult,
  CategoryInput,
  EditTransactionInput,
  GoalInput,
  ProfileInput,
  RecurringInput,
  RoundupSweepResult,
} from "@/lib/api";
import type { AppLocale, LocalePref } from "@/lib/locale";
import type { TrendPeriod, TrendView } from "@/lib/reports";
import type { SortDir, SortKey } from "@/lib/search";
import type {
  AddMode,
  BudgetSummary,
  Category,
  FlowStep,
  Frequency,
  Goal,
  IncomeSource,
  MobileScreen,
  RecurringItem,
  Transaction,
  TxnFilter,
  User,
  WebView,
} from "@/lib/types";

export interface AppState {
  // Server data (persisted in Neon for the single test user)
  user: User;
  categories: Category[];
  transactions: Transaction[];
  summary: BudgetSummary;
  loaded: boolean;
  /** Set when the data fetch failed after auth — the app shows an error screen. */
  loadError: boolean;
  /** True while the (large) transactions payload is still loading after the
   *  summary has painted the shell — transaction-derived widgets show skeletons. */
  transactionsLoading: boolean;

  // Loaded from /api/summary alongside categories + summary.
  goals: Goal[];
  recurring: RecurringItem[];
  incomeSources: IncomeSource[];

  // Mobile navigation
  mobileScreen: MobileScreen;
  /** The screen the Add flow was opened from, so it returns there (not always
   *  Home) on save/cancel. */
  addReturnTo: MobileScreen;
  selectedCategoryId: string;
  selectedTxnId: string;

  // Add flow (shared by mobile Add screen + web Add modal)
  addMode: AddMode;
  addAmountCents: number;
  addMerchant: string;
  /** Optional `YYYY-MM-DD`; blank means today when the transaction is saved. */
  addOccurredAt: string;
  addCategoryId: string;
  /** Income source selected in the shared Add flow; expense adds leave it blank. */
  addIncomeSourceId: string;
  addRecurring: boolean;
  addFrequency: Frequency;
  /** Add-flow write state, shared by desktop modal and mobile screen. */
  addSubmitting: boolean;
  addSaveError: string | null;

  // Mobile search
  searchQuery: string;
  searchType: TxnFilter;
  searchCategoryId: string;
  searchCategoryIds: string[];
  searchDateFrom: string;
  searchDateTo: string;
  searchAmountMin: string;
  searchAmountMax: string;

  /** Category-id filter shared by the web + mobile Transactions views, or "all".
   *  Set when you tap a category on the dashboard to see just its transactions. */
  txnCategory: string;

  // Web
  webView: WebView;
  webAddOpen: boolean;
  /** Direct category-creation modal opened from the desktop Budget header. */
  webAddCategoryOpen: boolean;
  /** The all-in-one "Edit budget" modal (opened from the Budget tab, the Home
   *  checklist, and the empty safe-to-spend tile). */
  webEditBudgetOpen: boolean;
  webUserMenuOpen: boolean;
  webTxnQuery: string;
  webTxnType: TxnFilter;
  webSortKey: SortKey;
  webSortDir: SortDir;
  // Advanced (popover) filters on the Transactions table. Dates are ISO
  // "YYYY-MM-DD"; amounts are raw dollar strings parsed to cents when filtering.
  webDateFrom: string;
  webDateTo: string;
  webAmountMin: string;
  webAmountMax: string;
  webTxnCategoryIds: string[];
  webBudgets: Record<string, number>;
  // Transaction id being edited in the web edit modal, or null when closed.
  webEditTxnId: string | null;
  // Selected month on the Trends view ("2026-06"); "" = use the default month.
  // Used when drilling the Trends "month" period into a specific month.
  trendMonthKey: string;
  // Selected reporting period on the Trends view (this month / 6m / 12m / YTD).
  trendPeriod: TrendPeriod;
  // Which Trends report is showing — cash flow (default) or spending (plan 012).
  trendView: TrendView;
  // Focused month in Cash Flow's fixed six-month window; blank selects its latest month.
  cashFlowMonthKey: string;
  // Selected month for month-scoped views (Transactions, Categories); "" = the
  // latest month with data.
  viewMonthKey: string;

  /** Theme preference: "system" (default) follows the device's
   *  prefers-color-scheme live; "light"/"dark" pin it. Persisted to
   *  localStorage; a no-FOUC script in layout.tsx sets the initial class. */
  themePref: "system" | "light" | "dark";
  /** The resolved active theme (derived from `themePref` + the OS), applied to
   *  <html> as the `.dark` class. */
  theme: "light" | "dark";

  /** Language preference (plan 013). Persisted only in the `sprout-locale-pref`
   *  cookie; the localized layout seeds both values per request so hydration
   *  matches what the server rendered. "system" follows Accept-Language. */
  localePref: LocalePref;
  /** The request-resolved locale the UI is currently rendered in. */
  locale: AppLocale;

  // Auth gate state. Post-signup setup happens in-app (Home activation), so the
  // gate itself is just signup/login now — see plans/007.
  flowStep: FlowStep;
}

/** Actions + async thunks. Colocated with state in the Zustand store, so adding
 *  one is a single edit (no separate context value / deps array to keep in sync). */
export interface AppActions {
  set: (patch: Partial<AppState>) => void;
  /** Set the theme preference, persist it, and update the `.dark` class on
   *  <html>. "system" resumes following the device setting. */
  setThemePref: (pref: "system" | "light" | "dark") => void;
  goMobile: (screen: MobileScreen) => void;
  openCategory: (id: string) => void;
  openTransaction: (id: string) => void;
  pressKey: (key: string) => void;
  commitAdd: () => void;
  resetAdd: () => void;
  toggleRecurring: (id: string) => void;
  /** Create an exact linked transaction for a scheduled bill/income occurrence. */
  markRecurringPaid: (id: string, dueDate: string) => Promise<void>;
  updateTransaction: (id: string, input: EditTransactionInput) => Promise<void>;
  setTransactionCategory: (
    id: string,
    categoryId: string | null,
    applyToMerchant?: boolean,
  ) => Promise<void>;
  bulkCategorize: (ids: string[], categoryId: string | null) => Promise<number>;
  bulkSetIncomeSource: (ids: string[], incomeSourceId: string | null) => Promise<number>;
  bulkExclude: (ids: string[]) => Promise<number>;
  bulkInclude: (ids: string[]) => Promise<number>;
  bulkDelete: (ids: string[]) => Promise<number>;
  deleteTransaction: (id: string) => Promise<void>;
  updateProfile: (input: ProfileInput) => Promise<void>;
  saveGoal: (input: GoalInput, id?: string) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  sweepRoundups: () => Promise<RoundupSweepResult>;
  saveRecurring: (input: RecurringInput, id?: string) => Promise<void>;
  removeRecurring: (id: string) => Promise<void>;
  saveCategory: (input: CategoryInput, id?: string) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  saveIncomeSource: (input: { name: string; emoji: string }) => Promise<void>;
  removeIncomeSource: (id: string) => Promise<void>;
  categorizeBacklog: () => Promise<BacklogResult>;
  setBudget: (id: string, cents: number) => void;
  setBudgetPool: (cents: number) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  /** One-time auth check on mount; internal (called by StoreProvider). */
  bootstrap: () => Promise<void>;
}

export type AppStore = AppState & AppActions;
