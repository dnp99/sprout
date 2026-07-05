import type { TabKey } from "@/lib/types";

const COPY: Record<Exclude<TabKey, "add" | "home">, { emoji: string; title: string }> = {
  categories: { emoji: "👀", title: "Categories" },
  goals: { emoji: "🎯", title: "Goals" },
  bills: { emoji: "🧾", title: "Bills" },
};

/** Friendly stub for tabs not built in this first pass. */
export function Placeholder({ tab }: { tab: Exclude<TabKey, "add" | "home"> }) {
  const { emoji, title } = COPY[tab];
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-8 text-center">
      <div className="text-5xl">{emoji}</div>
      <h1 className="mt-4 text-2xl font-extrabold text-ink">{title}</h1>
      <p className="mt-2 text-sm font-medium text-muted">
        This screen is coming next. The Home tab is the focus of this first build.
      </p>
    </div>
  );
}
