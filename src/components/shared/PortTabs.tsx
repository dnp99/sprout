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
          icon: <Download size={14} strokeWidth={2} />,
          label: t("export"),
        },
        {
          value: "import",
          icon: <Upload size={14} strokeWidth={2} />,
          label: t("import"),
        },
      ]}
      shape="rounded"
    />
  );
}
