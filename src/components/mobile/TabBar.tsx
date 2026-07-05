"use client";

import type { MobileScreen, TabKey } from "@/lib/types";
import { useStore } from "@/state/store";

const TABS: { key: TabKey; emoji: string; label: string }[] = [
  { key: "home", emoji: "🏠", label: "Home" },
  { key: "categories", emoji: "📊", label: "Categories" },
  { key: "goals", emoji: "🎯", label: "Goals" },
  { key: "bills", emoji: "🧾", label: "Bills" },
];

/** Which tab a given screen belongs under (for highlighting). */
function tabForScreen(screen: MobileScreen): TabKey | null {
  if (screen === "home") return "home";
  if (screen === "categories" || screen === "catDetail" || screen === "addCat") return "categories";
  if (screen === "goals") return "goals";
  if (screen === "bills" || screen === "addBill" || screen === "recurring") return "bills";
  return null;
}

export function TabBar() {
  const { mobileScreen, goMobile } = useStore();
  const activeTab = tabForScreen(mobileScreen);

  return (
    <nav className="sticky bottom-0 z-40 flex items-center gap-1 border-t border-track bg-card px-3.5 pb-3.5 pt-2">
      {TABS.slice(0, 2).map((tab) => (
        <TabButton
          key={tab.key}
          emoji={tab.emoji}
          label={tab.label}
          active={activeTab === tab.key}
          onClick={() => goMobile(tab.key)}
        />
      ))}

      <button
        type="button"
        onClick={() => goMobile("add")}
        aria-label="Add transaction"
        className="-mt-[18px] flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full bg-primary text-[26px] leading-none text-white shadow-lg shadow-primary/40 transition active:scale-95"
      >
        +
      </button>

      {TABS.slice(2).map((tab) => (
        <TabButton
          key={tab.key}
          emoji={tab.emoji}
          label={tab.label}
          active={activeTab === tab.key}
          onClick={() => goMobile(tab.key)}
        />
      ))}
    </nav>
  );
}

function TabButton({
  emoji,
  label,
  active,
  onClick,
}: {
  emoji: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 flex-col items-center gap-1 py-1"
    >
      <span
        className="text-[19px] leading-none"
        style={{ filter: active ? "none" : "grayscale(1)" }}
      >
        {emoji}
      </span>
      <span className="text-[10px] font-bold" style={{ color: active ? "#d97a54" : "#c9b49b" }}>
        {label}
      </span>
    </button>
  );
}
