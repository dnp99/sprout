"use client";

import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import type { TransactionScope } from "@/lib/transactions/scoped-filter";

const scopes = ["all", "expense", "income"] as const;
/** Segments mirror Week/Month; horizontal swipes and arrow keys move one scope
 * without turning vertical scrolling into a filter change. */
export function TransactionScopeSwitch({
  value,
  onChange,
  disabled = false,
}: {
  value: TransactionScope | null;
  onChange: (scope: TransactionScope) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("txns");
  const start = useRef<{ x: number; y: number } | null>(null);
  const move = (delta: number) => {
    const next = scopes[(value ? scopes.indexOf(value) : 0) + delta];
    if (!disabled && next) onChange(next);
  };
  return (
    <SegmentedControl
      value={value ?? ""}
      onChange={(next) => {
        if (next) onChange(next);
      }}
      disabled={disabled}
      label={t("transactionScope")}
      className="calendar-segments mb-3 w-full touch-pan-y"
      appearance="calendar"
      size="compact"
      options={scopes.map((scope) => ({
        value: scope,
        label: t(scope === "all" ? "chipAll" : scope === "expense" ? "chipExpense" : "chipIncome"),
      }))}
      onTouchStart={(event) => {
        const touch = event.touches[0];
        start.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
      }}
      onTouchEnd={(event) => {
        const touch = event.changedTouches[0],
          previous = start.current;
        start.current = null;
        if (!touch || !previous) return;
        const x = touch.clientX - previous.x,
          y = touch.clientY - previous.y;
        if (Math.abs(x) >= 32 && Math.abs(x) > Math.abs(y)) move(x < 0 ? 1 : -1);
      }}
    />
  );
}
