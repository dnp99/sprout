"use client";

import { Download, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

export type PortTab = "export" | "import";

/** Export / Import segmented control shared by the web and mobile data screens. */
export function PortTabs({ tab, onChange }: { tab: PortTab; onChange: (t: PortTab) => void }) {
  const t = useTranslations("importer");
  return (
    <div className="inline-flex rounded-[14px] border border-edge bg-track/70 p-1.5">
      {(["export", "import"] as PortTab[]).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={tab === value}
          className={`flex min-w-[126px] items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-semibold transition ${
            tab === value
              ? "bg-card text-ink shadow-sm ring-1 ring-soft-border"
              : "text-muted hover:text-ink"
          }`}
        >
          {value === "export" ? (
            <Download size={14} strokeWidth={2} />
          ) : (
            <Upload size={14} strokeWidth={2} />
          )}
          {value === "export" ? t("export") : t("import")}
        </button>
      ))}
    </div>
  );
}
