"use client";

import { Check, ChevronRight } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

/** One first-run setup task. `done` is derived from real data (budget set, a
 *  transaction exists, …); `required` tasks gate whether the whole card shows. */
export interface ActivationItem {
  key: string;
  label: string;
  done: boolean;
  /** When every `required` item is done, activation is complete and the card
   *  hides — so optional nudges (e.g. a goal) never nag forever. */
  required?: boolean;
  onClick: () => void;
}

/** First-run "get started" checklist shown on Home / Overview for new users.
 *  Purely derived from data (see plans/007): it renders nothing once the core
 *  (required) steps are done, and each row deep-links into the relevant flow.
 *  Presentational + surface-agnostic — callers pass items with their own nav. */
export function ActivationChecklist({ items }: { items: ActivationItem[] }) {
  const activationDone = items.filter((i) => i.required).every((i) => i.done);
  if (activationDone) return null;

  const doneCount = items.filter((i) => i.done).length;

  return (
    <div className="overflow-hidden rounded-[14px] border border-edge">
      <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
        <span className="text-[13px] font-bold text-ink">Get started</span>
        <span className="text-[11px] font-semibold text-muted">
          {doneCount} of {items.length}
        </span>
      </div>
      <div className="flex flex-col pb-1.5">
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
    </div>
  );
}
