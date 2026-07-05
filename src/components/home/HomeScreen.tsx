"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatMoney, spentPercent } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";
import { useStore } from "@/state/store";

// The four categories the Home screen highlights, in the prototype's order.
const HOME_CATEGORY_IDS = ["c_groceries", "c_dining", "c_shopping", "c_transport"];

export function HomeScreen() {
  const { user, categories, transactions, summary } = useStore();

  const leftCents = summary.budgetCents - summary.spentCents;
  const budgetPercent = spentPercent(summary.spentCents, summary.budgetCents);

  const homeCategories = HOME_CATEGORY_IDS.map((id) => categories.find((c) => c.id === id)).filter(
    (c): c is Category => Boolean(c),
  );

  const recent = transactions.slice(0, 5);

  return (
    <div className="px-[22px] pt-3">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Hey {user.greetingName} 👋</h1>
          <p className="mt-0.5 text-[12.5px] font-medium text-muted">
            You&rsquo;re doing great this month
          </p>
        </div>
        <button
          type="button"
          aria-label="Settings"
          className="h-[42px] w-[42px] flex-none rounded-full bg-peach"
        />
      </header>

      {/* Safe to spend */}
      <section className="mt-6">
        <div className="text-[11.5px] font-extrabold uppercase tracking-wide text-muted">
          Safe to spend
        </div>
        <div className="mt-1 text-[42px] font-extrabold leading-none tracking-tight text-ink tabular-nums">
          {formatMoney(summary.safeToSpendCents)}
        </div>
      </section>

      {/* Budget card */}
      <button type="button" className="mt-[18px] w-full rounded-card bg-card p-5 text-left">
        <div className="flex items-center justify-between text-[12.5px] font-bold text-muted">
          <span>Spent this month</span>
          <span className="text-ink">
            {formatMoney(summary.spentCents)}{" "}
            <span className="text-subtle">/ {formatMoney(summary.budgetCents)}</span>
          </span>
        </div>
        <ProgressBar percent={budgetPercent} color="#d97a54" height={9} className="mt-3" />
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[11.5px] font-semibold text-muted">
            {formatMoney(leftCents)} left · {summary.daysLeft} days to go
          </span>
          <span className="text-[11.5px] font-extrabold text-primary">Edit budget ›</span>
        </div>
      </button>

      {/* Categories */}
      <SectionHeader title="Categories" action="See all ›" className="mt-6" />
      <div className="mt-3.5 flex flex-col gap-3.5">
        {homeCategories.map((category) => (
          <CategoryRow key={category.id} category={category} />
        ))}
      </div>

      {/* Recent transactions */}
      <SectionHeader title="Recent transactions" action="See all ›" className="mt-[22px]" />
      <div className="mt-3 flex flex-col gap-2.5">
        {recent.map((transaction) => (
          <TransactionCard key={transaction.id} transaction={transaction} />
        ))}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between ${className ?? ""}`}>
      <h2 className="text-base font-extrabold text-ink">{title}</h2>
      <button type="button" className="text-xs font-bold text-primary">
        {action}
      </button>
    </div>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const percent = spentPercent(category.spentCents, category.monthlyBudgetCents);
  return (
    <button type="button" className="flex items-center gap-3 text-left">
      <span className="text-xl leading-none">{category.emoji}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between text-[13.5px] font-bold text-ink">
          <span>{category.name}</span>
          <span className="tabular-nums">{formatMoney(category.spentCents)}</span>
        </div>
        <ProgressBar percent={percent} color={category.color} className="mt-1.5" />
      </div>
    </button>
  );
}

function TransactionCard({ transaction }: { transaction: Transaction }) {
  const isIncome = transaction.amountCents > 0;
  return (
    <button
      type="button"
      className="flex items-center gap-3 rounded-pill bg-card px-[15px] py-3 text-left"
    >
      <span className="text-xl leading-none">{transaction.emoji}</span>
      <div className="flex-1">
        <div className="text-sm font-bold text-ink">{transaction.merchant}</div>
        <div className="text-[11px] font-medium text-muted">
          {transaction.categoryName} · {transaction.dateLabel}
        </div>
      </div>
      <span
        className={`text-sm font-extrabold tabular-nums ${isIncome ? "text-green" : "text-ink"}`}
      >
        {formatMoney(transaction.amountCents, { signed: true })}
      </span>
    </button>
  );
}
