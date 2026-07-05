"use client";

import { Avatar } from "@/components/ui/Avatar";
import type { WebView } from "@/lib/types";
import { useStore } from "@/state/store";

const NAV: { view: WebView; emoji: string; label: string }[] = [
  { view: "overview", emoji: "🏠", label: "Overview" },
  { view: "transactions", emoji: "📝", label: "Transactions" },
  { view: "categories", emoji: "📊", label: "Categories" },
  { view: "trends", emoji: "📈", label: "Trends" },
  { view: "goals", emoji: "🎯", label: "Goals" },
  { view: "bills", emoji: "🧾", label: "Bills & recurring" },
  { view: "import", emoji: "📥", label: "Import" },
  { view: "settings", emoji: "⚙️", label: "Settings" },
];

export function Sidebar() {
  const { user, webView, webUserMenuOpen, set, logout } = useStore();

  return (
    <div className="flex w-[214px] flex-none flex-col gap-1.5 border-r border-track bg-card p-4">
      <div className="mb-4 px-1.5 text-xl font-extrabold text-primary">🌱 Sprout</div>

      {NAV.map((item) => {
        const active = webView === item.view;
        return (
          <button
            key={item.view}
            type="button"
            onClick={() => set({ webView: item.view })}
            className={`flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-left text-[13.5px] transition ${
              active ? "bg-[#fbeee2] font-extrabold text-primary-dark" : "font-bold text-muted"
            }`}
          >
            <span className="text-base">{item.emoji}</span>
            {item.label}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => set({ webAddOpen: true })}
        className="mt-4 rounded-[14px] bg-primary py-3 text-center text-[13.5px] font-extrabold text-white"
      >
        + Add transaction
      </button>

      <div className="relative mt-auto">
        {webUserMenuOpen && (
          <div className="absolute bottom-[52px] left-0 right-0 z-10 rounded-[14px] border border-track bg-card p-1.5 shadow-xl">
            <button
              type="button"
              onClick={() => set({ webView: "settings", webUserMenuOpen: false })}
              className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] font-bold text-ink"
            >
              ⚙️ Settings
            </button>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] font-extrabold text-primary-dark"
            >
              ↩️ Log out
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => set({ webUserMenuOpen: !webUserMenuOpen })}
          className="flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left"
        >
          <Avatar size={32} />
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[12.5px] font-extrabold text-ink">{user.name}</div>
            <div className="text-[10.5px] text-muted">Personal</div>
          </div>
          <span className="text-sm font-extrabold text-subtle">⋯</span>
        </button>
      </div>
    </div>
  );
}
