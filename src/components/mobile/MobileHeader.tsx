"use client";

import { Plus } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Avatar } from "@/components/ui/Avatar";
import { useStore } from "@/state/store";
import type { MobileScreen } from "@/lib/types";

const PRIMARY_SCREENS = new Set<MobileScreen>(["home", "history", "categories", "trends", "bills"]);

/** Sticky top chrome for the mobile surface. Keeps the current section title
 *  visible and puts the primary action where users expect it. */
export function MobileHeader({ screen }: { screen: MobileScreen }) {
  const { user, goMobile } = useStore(useShallow((s) => ({ user: s.user, goMobile: s.goMobile })));

  if (!PRIMARY_SCREENS.has(screen)) return null;

  if (screen === "home") {
    const todayLabel = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    return (
      <header className="shrink-0 border-b border-edge/60 bg-bg/95 px-4 py-3.5 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[24px] font-bold leading-none tracking-[-.02em] text-ink">
              Hey {user.greetingName}
            </h1>
            <p className="mt-1.5 text-[12.5px] font-medium text-muted">{todayLabel}</p>
          </div>
          <button
            type="button"
            aria-label="Account & settings"
            onClick={() => goMobile("settings")}
          >
            <Avatar size={40} initial={user.greetingName.slice(0, 1)} />
          </button>
        </div>
      </header>
    );
  }

  const title =
    screen === "history"
      ? "Transactions"
      : screen === "categories"
        ? "Categories"
        : screen === "trends"
          ? "Trends"
          : "Bills";

  const action =
    screen === "history" ? (
      <button
        type="button"
        onClick={() => goMobile("add")}
        className="flex items-center gap-1.5 rounded-pill bg-primary px-3 py-1.5 text-onprimary shadow-[0_10px_24px_rgba(217,113,78,0.22)]"
      >
        <Plus size={13} strokeWidth={2.6} />
        <span className="text-[11.5px] font-semibold">Add</span>
      </button>
    ) : screen === "bills" ? (
      <button
        type="button"
        onClick={() => goMobile("addBill")}
        className="flex items-center gap-1.5 rounded-pill bg-primary px-3 py-1.5 text-onprimary shadow-[0_10px_24px_rgba(217,113,78,0.22)]"
      >
        <Plus size={13} strokeWidth={2.6} />
        <span className="text-[11.5px] font-semibold">Add</span>
      </button>
    ) : null;

  return (
    <header className="shrink-0 border-b border-edge/60 bg-bg/95 px-4 py-3.5 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[20px] font-bold tracking-[-.02em] text-ink">{title}</h1>
        {action}
      </div>
    </header>
  );
}
