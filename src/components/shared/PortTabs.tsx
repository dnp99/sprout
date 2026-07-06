"use client";

export type PortTab = "export" | "import";

/** Export / Import segmented control shared by the web and mobile data screens. */
export function PortTabs({ tab, onChange }: { tab: PortTab; onChange: (t: PortTab) => void }) {
  return (
    <div className="inline-flex gap-1 rounded-2xl bg-[#f0e5d6] p-1">
      {(["export", "import"] as PortTab[]).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`rounded-xl px-4 py-2 text-[12.5px] font-bold ${
            tab === t ? "bg-card text-ink shadow-sm" : "text-muted"
          }`}
        >
          {t === "export" ? "⬇️ Export" : "⬆️ Import"}
        </button>
      ))}
    </div>
  );
}
