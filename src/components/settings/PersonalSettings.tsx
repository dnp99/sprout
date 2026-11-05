"use client";

import { BookOpen, BriefcaseBusiness, KeyRound, Sparkles, Tags } from "lucide-react";
import { useTranslations } from "next-intl";
import { SettingsWorkspace } from "./SettingsWorkspace";
import { PersonalCategorySettings } from "./PersonalCategorySettings";
import { ConnectedApps } from "./ConnectedApps";
import { RulesPanel } from "./RulesPanel";
import { BusinessesPanel } from "./BusinessesPanel";
import { GettingStartedPanel } from "./GettingStartedPanel";
import { PwaInstallCard } from "./PwaInstallCard";
import { WhatsNewCard } from "./WhatsNew";

/** Personal capture stays explicitly scoped here; account preferences live in Account. */
export function PersonalSettings({ mobile = false }: { mobile?: boolean }) {
  const t = useTranslations("settingsNavigation");
  return (
    <SettingsWorkspace
      sections={[
        {
          id: "categories",
          label: t("categories"),
          icon: Tags,
          content: <PersonalCategorySettings />,
        },
        { id: "rules", label: t("rules"), icon: Tags, content: <RulesPanel /> },
        {
          id: "businesses",
          label: t("businesses"),
          icon: BriefcaseBusiness,
          content: <BusinessesPanel />,
        },
        {
          id: "connected-apps",
          label: t("capture"),
          icon: KeyRound,
          content: (
            <>
              <p className="text-body text-muted">{t("captureHint")}</p>
              <ConnectedApps />
            </>
          ),
        },
        {
          id: "learning",
          label: t("learning"),
          icon: BookOpen,
          area: "app",
          content: <GettingStartedPanel mobile={mobile} />,
        },
        {
          id: "app",
          label: t("appInfo"),
          icon: Sparkles,
          area: "app",
          content: (
            <>
              <PwaInstallCard />
              <WhatsNewCard />
            </>
          ),
        },
      ]}
    />
  );
}
