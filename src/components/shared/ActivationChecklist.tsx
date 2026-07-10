"use client";

import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

/** One first-run setup task. `done` is derived from real data (budget set, a
 *  transaction exists, …); `required` tasks mark the core setup milestones. */
export interface ActivationItem {
  key: string;
  label: string;
  done: boolean;
  /** Core setup milestones. Optional items stay as visible nudges once the
   *  basics are done, but do not block the progress story. */
  required?: boolean;
  onClick: () => void;
}

/** First-run "get started" checklist shown on Home / Overview for new users.
 *  Purely derived from data (see plans/007): it stays visible even after the
 *  core setup is done so Overview/Home keep a stable onboarding surface and the
 *  user can still revisit optional nudges. Presentational + surface-agnostic —
 *  callers pass items with their own nav. */
export function ActivationChecklist({
  items,
  className,
  subtitle,
}: {
  items: ActivationItem[];
  className?: string;
  subtitle?: string;
}) {
  const activationDone = items.filter((i) => i.required).every((i) => i.done);
  const doneCount = items.filter((i) => i.done).length;
  const progress = items.length > 0 ? doneCount / items.length : 0;
  const circumference = 2 * Math.PI * 18;
  const offset = circumference * (1 - progress);
  const [collapsed, setCollapsed] = useState(false);
  const resolvedSubtitle = activationDone
    ? "The essentials are done. Optional setup is still here when you want it."
    : subtitle;

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-[14px] border border-edge ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-4 px-4 pb-3 pt-4">
        <div className="min-w-0">
          <div className="text-[15px] font-bold text-ink">
            {activationDone ? "You're set" : "Get started"}
          </div>
          {resolvedSubtitle && (
            <div className="mt-1 text-[12px] font-medium text-muted">{resolvedSubtitle}</div>
          )}
        </div>

        <div className="relative flex h-14 w-14 flex-none items-center justify-center">
          <svg viewBox="0 0 44 44" className="h-14 w-14 -rotate-90">
            <circle cx="22" cy="22" r="18" fill="none" stroke="var(--edge)" strokeWidth="4" />
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke="var(--pos)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[14px] font-bold tabular-nums text-ink">
              {doneCount}/{items.length}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-edge px-4 pb-2.5 pt-3">
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
          className="mb-2 flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[.05em] text-muted">
            Checklist
          </span>
          <ChevronDown
            size={16}
            strokeWidth={2.2}
            className={`text-muted transition-transform ${collapsed ? "-rotate-90" : ""}`}
          />
        </button>

        {!collapsed && (
          <div className="flex flex-col rounded-[12px] bg-track/45 py-1">
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  trackEvent("activation_item_clicked", { item: item.key });
                  item.onClick();
                }}
                className="flex items-center gap-3 px-4 py-2.5 text-left"
              >
                {item.done ? (
                  <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary text-onprimary">
                    <Check size={13} strokeWidth={3} />
                  </span>
                ) : (
                  <span className="h-5 w-5 flex-none rounded-full border-2 border-track" />
                )}
                <span
                  className={`flex-1 text-[13px] font-semibold ${
                    item.done ? "text-muted line-through" : "text-ink"
                  }`}
                >
                  {item.label}
                </span>
                {!item.done && (
                  <ChevronRight size={16} strokeWidth={2} className="flex-none text-muted" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
