"use client";

import { Download, Upload } from "lucide-react";

export type PortTab = "export" | "import";

/** Export / Import segmented control shared by the web and mobile data screens. */
export function PortTabs({ tab, onChange }: { tab: PortTab; onChange: (t: PortTab) => void }) {
  return (
    <div className="inline-flex gap-1 rounded-[10px] bg-track p-1">
      {(["export", "import"] as PortTab[]).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          aria-pressed={tab === t}
          className={`flex items-center gap-1.5 rounded-[7px] px-4 py-2 text-[12.5px] font-semibold transition ${
            tab === t ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"
          }`}
        >
          {t === "export" ? (
            <Download size={14} strokeWidth={2} />
          ) : (
            <Upload size={14} strokeWidth={2} />
          )}
          {t === "export" ? "Export" : "Import"}
        </button>
      ))}
    </div>
  );
}
