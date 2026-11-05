"use client";

import { Download, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { TabList } from "@/components/ui/Tabs";

export type PortTab = "export" | "import";

/** Import/export owners supply Tabs so the control and its panel share IDs and scroll policy. */
export function PortTabs() {
  const t = useTranslations("importer");
  return (
    <TabList
      label={`${t("export")} / ${t("import")}`}
      options={[
        {
          value: "export",
          label: (
            <>
              <Download size={14} strokeWidth={2} />
              {t("export")}
            </>
          ),
        },
        {
          value: "import",
          label: (
            <>
              <Upload size={14} strokeWidth={2} />
              {t("import")}
            </>
          ),
        },
      ]}
      className="inline-flex rounded-[14px] border border-edge bg-track p-1.5"
      buttonClassName={(active) =>
        `flex min-w-[126px] items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-semibold transition-colors ${active ? "bg-primary text-onprimary shadow-sm" : "text-muted hover:text-ink"}`
      }
    />
  );
}
