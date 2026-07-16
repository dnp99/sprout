"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { BudgetHeroModel, HeroCoachTone, HeroMessage, HeroTone } from "@/lib/budget-hero";

/** Budget-ring hero (from the "Hero card — budget ring" handoff). Leads with the
 *  pool as permission to spend ("Yours to spend") + a daily allowance; the ring is
 *  a calm "how little you've used" gauge that animates in on load; income & net
 *  sit at the foot. One component drives web + mobile off the shared
 *  `buildBudgetHero` view-model across all five states. Copy arrives as message
 *  descriptors into the `hero` catalog namespace and is translated here, at the
 *  edge (plan 013 §D). */

const RING_CIRCUMFERENCE = 2 * Math.PI * 52; // r=52 → ~326.73

const TONE_TEXT: Record<HeroTone, string> = {
  green: "text-green",
  primary: "text-primary",
  primaryDark: "text-primary-dark",
  ink: "text-ink",
  muted: "text-muted",
};

/** Coach pill: tinted fill + matching dot, per tone. */
const PILL: Record<HeroCoachTone, { box: string; dot: string }> = {
  green: { box: "bg-green/15 text-green", dot: "bg-green" },
  primary: { box: "bg-primary/15 text-primary-dark", dot: "bg-primary" },
  primaryDark: { box: "bg-primary-dark/15 text-primary-dark", dot: "bg-primary-dark" },
  muted: { box: "bg-track text-muted", dot: "bg-subtle" },
};

type Translate = ReturnType<typeof useTranslations<"hero">>;

/** Render a HeroMessage, mapping the message's <b> chunks to the emphasized
 *  figure style. */
function Msg({ t, m }: { t: Translate; m: HeroMessage }) {
  return (
    <>
      {t.rich(m.key as Parameters<Translate["rich"]>[0], {
        ...m.params,
        b: (chunks) => <span className="font-semibold text-ink">{chunks}</span>,
      })}
    </>
  );
}

export function BudgetRingHero({
  model,
  onEdit,
  onSetBudget,
  dense = false,
  className = "",
}: {
  model: BudgetHeroModel;
  onEdit: () => void;
  onSetBudget: () => void;
  /** Phone-width variant: compact footer labels so they don't wrap. */
  dense?: boolean;
  className?: string;
}) {
  const t = useTranslations("hero");
  const card = `relative w-full overflow-hidden rounded-[16px] border border-edge bg-card p-4 text-left ${className}`;

  if (!model.hasBudget) {
    return (
      <div className={card}>
        {/* Ghost ring, echoing the funded card. */}
        <div className="pointer-events-none absolute right-[-28px] top-[-30px] h-[120px] w-[120px]">
          <svg viewBox="0 0 120 120" className="h-full w-full">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="var(--border)"
              strokeWidth="11"
              strokeDasharray="6 9"
              strokeLinecap="round"
              opacity="0.7"
            />
          </svg>
        </div>
        <div className="relative">
          <MonthPill label={model.monthLabel} />
          <div className="mt-4 text-[11px] font-semibold uppercase tracking-[.06em] text-muted">
            {t("emptyLabel")}
          </div>
          <div className="mt-1.5 text-[22px] font-bold leading-tight tracking-[-0.02em] text-ink">
            {t("emptyTitle")}
          </div>
          <div className="mt-2 max-w-[38ch] text-[12.5px] font-medium leading-relaxed text-muted">
            {t("emptyBody")}
          </div>
          <button
            type="button"
            onClick={onSetBudget}
            className="mt-4 inline-flex items-center gap-1.5 rounded-[11px] bg-primary px-4 py-2.5 text-[13px] font-semibold text-onprimary"
          >
            {t("emptyCta")}
          </button>
          <Footer t={t} left={model.footerLeft} right={model.footerRight} dense={dense} />
        </div>
      </div>
    );
  }

  return (
    <button type="button" onClick={onEdit} className={card}>
      {/* Header pills */}
      <div className="flex items-center justify-between gap-3">
        <MonthPill label={model.monthLabel} />
        <span className="flex-none rounded-full bg-track px-2.5 py-1 text-[11px] font-semibold text-muted">
          {t("daysLeft", { days: model.daysLeft })}
        </span>
      </div>

      {/* Headline */}
      <div
        className={`mt-4 text-[11px] font-semibold uppercase tracking-[.06em] ${TONE_TEXT[model.headlineLabelTone]}`}
      >
        {t(model.headlineLabelKey as Parameters<Translate>[0])}
      </div>
      <div
        className={`mt-1 text-[34px] font-bold leading-none tracking-[-0.035em] tabular-nums ${TONE_TEXT[model.headlineValueTone]}`}
      >
        {model.headlineValue}
      </div>
      <span className="mt-1.5 block text-[12.5px] font-medium text-muted">
        <Msg t={t} m={model.sub} />
      </span>

      {/* Payday banner */}
      {model.payday && (
        <div className="mt-3.5 flex items-center justify-between gap-3 rounded-[13px] border border-soft-border bg-primary-soft p-[11px_14px]">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-[34px] w-[34px] flex-none flex-col items-center justify-center rounded-[10px] border border-soft-border bg-card leading-none">
              <span className="text-[7px] font-bold uppercase tracking-[.04em] text-primary">
                {model.payday.weekdayShort}
              </span>
              <span className="text-[13px] font-bold text-ink">{model.payday.dayOfMonth}</span>
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-bold text-ink">
                <Msg t={t} m={model.payday.title} />
              </div>
              <div className="truncate text-[11px] font-medium text-muted">
                <Msg t={t} m={model.payday.subtitle} />
              </div>
            </div>
          </div>
          <div className="flex-none text-right">
            <div className="text-[16px] font-bold tabular-nums tracking-[-0.02em] text-green">
              {model.payday.amountLabel}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[.04em] text-muted">
              {t("incoming")}
            </div>
          </div>
        </div>
      )}

      {/* Ring gauge + coach */}
      <div className="mt-4 flex items-center gap-4">
        <Ring usedPct={model.usedPct} arcTone={model.ringArcTone}>
          <div
            className={`text-[9px] font-bold uppercase tracking-[.05em] ${model.ringArcTone === "primaryDark" ? "text-primary-dark" : "text-muted"}`}
          >
            {t("used")}
          </div>
          <div
            className={`mt-0.5 text-[15px] font-bold tabular-nums tracking-[-0.02em] ${TONE_TEXT[model.ringUsedTone]}`}
          >
            {model.ringValue}
          </div>
          <div className="text-[9.5px] font-semibold tabular-nums text-muted">
            <Msg t={t} m={model.ringSub} />
          </div>
        </Ring>

        <div className="min-w-0 flex-1">
          <div
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] text-[11.5px] font-semibold ${PILL[model.coach.tone].box}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${PILL[model.coach.tone].dot}`} />
            <Msg t={t} m={model.coach.pill} />
          </div>
          <span className="mt-2.5 block text-[12px] font-medium leading-[1.45] text-muted">
            <Msg t={t} m={model.coach.sentence} />
          </span>
        </div>
      </div>

      {/* Footer */}
      <Footer t={t} left={model.footerLeft} right={model.footerRight} dense={dense} onEdit />
    </button>
  );
}

function MonthPill({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full bg-primary-soft px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[.05em] text-primary">
      {label}
    </span>
  );
}

/** The budget-used donut. Animates the arc from empty to `usedPct` on mount. */
function Ring({
  usedPct,
  arcTone,
  children,
}: {
  usedPct: number;
  arcTone: "primary" | "primaryDark";
  children: React.ReactNode;
}) {
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Keep a small visible sliver once anything has been spent.
  const frac = usedPct <= 0 ? 0 : Math.min(1, Math.max(0.03, usedPct / 100));
  const target = RING_CIRCUMFERENCE * (1 - frac);
  const offset = filled ? target : RING_CIRCUMFERENCE;

  return (
    <div className="relative h-[108px] w-[108px] flex-none">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--muted-bg)" strokeWidth="11" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke={arcTone === "primaryDark" ? "var(--primary-dark)" : "var(--primary)"}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="[transition:stroke-dashoffset_1.1s_cubic-bezier(.34,1.05,.4,1)] motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

function Footer({
  t,
  left,
  right,
  dense,
  onEdit,
}: {
  t: Translate;
  left: { labelKey: string; shortLabelKey?: string; value: string; tone: HeroTone };
  right: { labelKey: string; shortLabelKey?: string; value: string; tone: HeroTone };
  dense?: boolean;
  onEdit?: boolean;
}) {
  return (
    <div className="mt-4 flex items-center gap-4 border-t border-edge pt-3">
      {[left, right].map((cell, i) => (
        <div key={cell.labelKey} className="flex flex-1 items-stretch gap-4">
          {i === 1 && <span className="w-px self-stretch bg-edge" />}
          <div className="flex-1">
            <div className="text-[10.5px] font-bold uppercase tracking-[.05em] text-muted">
              {t(
                (dense
                  ? (cell.shortLabelKey ?? cell.labelKey)
                  : cell.labelKey) as Parameters<Translate>[0],
              )}
            </div>
            <div
              className={`mt-0.5 text-[16px] font-bold tabular-nums tracking-[-0.02em] ${TONE_TEXT[cell.tone]}`}
            >
              {cell.value}
            </div>
          </div>
        </div>
      ))}
      {onEdit && (
        <span className="flex-none self-end text-[11.5px] font-semibold text-primary">
          {t("edit")}
        </span>
      )}
    </div>
  );
}
