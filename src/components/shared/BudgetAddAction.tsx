"use client";

import { Plus } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

/** A consistent secondary action makes creation discoverable while Save stays primary. */
export function BudgetAddAction({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      type="button"
      className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-primary bg-primary-soft px-4 py-2.5 text-control font-semibold text-primary transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 ${className}`}
    >
      <Plus size={16} strokeWidth={2} aria-hidden="true" />
      {children}
    </button>
  );
}
