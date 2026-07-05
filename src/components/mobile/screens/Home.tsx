"use client";

import { Avatar } from "@/components/ui/Avatar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/headers";
import { CategoryBar, TransactionCard } from "@/components/ui/rows";
import { formatMoney, spentPercent } from "@/lib/format";
import { HOME_CATEGORY_IDS } from "@/lib/mock";
import type { Category } from "@/lib/types";
import { useStore } from "@/state/store";

export function Home() {
  const { user, categories, transactions, summary, goMobile, openCategory, openTransaction } =
    useStore();

  const leftCents = summary.budgetCents - summary.spentCents;
  const budgetPercent = spentPercent(summary.spentCents, summary.budgetCents);
  const homeCategories = HOME_CATEGORY_IDS.map((id) => categories.find((c) => c.id === id)).filter(
    (c): c is Category => Boolean(c),
  );
  const recent = transactions.slice(0, 5);

  return (
    <div className="px-[22px] pt-3">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Hey {user.greetingName} 👋</h1>
          <p className="mt-0.5 text-[12.5px] font-medium text-muted">
            You&rsquo;re doing great this month
          </p>
        </div>
        <button type="button" aria-label="Account & settings" onClick={() => goMobile("settings")}>
          <Avatar size={42} />
        </button>
      </header>

      <section className="mt-6">
        <div className="text-[11.5px] font-extrabold uppercase tracking-wide text-muted">
          Safe to spend
        </div>
        <div className="mt-1 text-[42px] font-extrabold leading-none tracking-tight text-ink tabular-nums">
          {formatMoney(summary.safeToSpendCents)}
        </div>
      </section>

      <button
        type="button"
        onClick={() => goMobile("budget")}
        className="mt-[18px] w-full rounded-card bg-card p-5 text-left"
      >
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

      <SectionHeader
        title="Categories"
        action="See all ›"
        onAction={() => goMobile("categories")}
        className="mt-6"
      />
      <div className="mt-3.5 flex flex-col gap-3.5">
        {homeCategories.map((category) => (
          <CategoryBar
            key={category.id}
            category={category}
            onClick={() => openCategory(category.id)}
          />
        ))}
      </div>

      <SectionHeader
        title="Recent transactions"
        action="See all ›"
        onAction={() => goMobile("history")}
        className="mt-[22px]"
      />
      <div className="mt-3 flex flex-col gap-2.5">
        {recent.map((txn) => (
          <TransactionCard key={txn.id} txn={txn} onClick={() => openTransaction(txn.id)} />
        ))}
      </div>
    </div>
  );
}
