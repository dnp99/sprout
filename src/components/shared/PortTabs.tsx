"use client";

import { Download, Upload } from "lucide-react";

export type PortTab = "export" | "import";

/** Export / Import segmented control shared by the web and mobile data screens. */
export function PortTabs({ tab, onChange }: { tab: PortTab; onChange: (t: PortTab) => void }) {
  return (
    <div className="inline-flex rounded-[14px] border border-edge bg-track/70 p-1.5">
      {(["export", "import"] as PortTab[]).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          aria-pressed={tab === t}
          className={`flex min-w-[126px] items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-semibold transition ${
            tab === t
              ? "bg-card text-ink shadow-sm ring-1 ring-soft-border"
              : "text-muted hover:text-ink"
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
