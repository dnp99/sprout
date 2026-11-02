"use client";

import { PersonalCategorySettings } from "./PersonalCategorySettings";
import { LogoutAction } from "./LogoutAction";
import { ConnectedApps } from "./ConnectedApps";
import { RulesPanel } from "./RulesPanel";
import { BusinessesPanel } from "./BusinessesPanel";
import { EditedHighlightSetting } from "./EditedHighlightSetting";
import { GettingStartedPanel } from "./GettingStartedPanel";
import { PwaInstallCard } from "./PwaInstallCard";
import { WhatsNewCard } from "./WhatsNew";

/** Personal ledger controls stay separate from the global account dialog. */
export function PersonalSettings({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className="space-y-4">
      <PersonalCategorySettings />
      <EditedHighlightSetting />
      <GettingStartedPanel mobile={mobile} />
      <ConnectedApps />
      <RulesPanel />
      <BusinessesPanel compact={mobile} />
      <PwaInstallCard />
      <WhatsNewCard />
      <LogoutAction />
    </div>
  );
}
