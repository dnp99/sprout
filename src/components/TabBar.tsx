"use client";

import { useStore } from "@/state/store";
import type { TabKey } from "@/lib/types";

interface TabBarProps {
  onAdd: () => void;
}

type NavItem = { key: Exclude<TabKey, "add">; label: string; icon: React.ReactNode };

const HomeIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M4 11.5 12 5l8 6.5M6 10.5V19h12v-8.5"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CategoriesIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="4" y="13" width="4" height="6" rx="1.5" fill="currentColor" />
    <rect x="10" y="8" width="4" height="11" rx="1.5" fill="currentColor" />
    <rect x="16" y="4" width="4" height="15" rx="1.5" fill="currentColor" />
  </svg>
);

const GoalsIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="2.2" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
  </svg>
);

const BillsIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="6" y="4" width="12" height="16" rx="2.5" stroke="currentColor" strokeWidth="2.2" />
    <path d="M9 9h6M9 13h6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Home", icon: HomeIcon },
  { key: "categories", label: "Categories", icon: CategoriesIcon },
  { key: "goals", label: "Goals", icon: GoalsIcon },
  { key: "bills", label: "Bills", icon: BillsIcon },
];

export function TabBar({ onAdd }: TabBarProps) {
  const { activeTab, setActiveTab } = useStore();

  return (
    <nav className="sticky bottom-0 z-40 flex items-center gap-1 border-t border-track bg-card px-3 pb-3 pt-2">
      {NAV_ITEMS.slice(0, 2).map((item) => (
        <TabButton
          key={item.key}
          item={item}
          active={activeTab === item.key}
          onClick={() => setActiveTab(item.key)}
        />
      ))}

      <button
        type="button"
        onClick={onAdd}
        aria-label="Add expense"
        className="-mt-6 flex h-14 w-14 flex-none items-center justify-center rounded-full bg-primary text-3xl leading-none text-white shadow-lg shadow-primary/40 transition active:scale-95"
      >
        +
      </button>

      {NAV_ITEMS.slice(2).map((item) => (
        <TabButton
          key={item.key}
          item={item}
          active={activeTab === item.key}
          onClick={() => setActiveTab(item.key)}
        />
      ))}
    </nav>
  );
}

function TabButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1 py-1 transition-colors ${
        active ? "text-primary" : "text-muted"
      }`}
    >
      {item.icon}
      <span className="text-[10px] font-bold">{item.label}</span>
    </button>
  );
}
