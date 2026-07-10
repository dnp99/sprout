"use client";

import { ConnectedApps } from "@/components/settings/ConnectedApps";
import { ScreenHeader } from "@/components/ui/headers";
import { useStore } from "@/state/store";

/** Mobile Settings → Connected apps. Thin wrapper (back header) around the
 *  shared token-management panel; the phone is a natural place to mint a token
 *  for the Siri Shortcut. */
export function ConnectedAppsScreen() {
  const goMobile = useStore((s) => s.goMobile);
  return (
    <div className="px-4 pb-4 pt-1">
      <ScreenHeader title="Connected apps" onBack={() => goMobile("settings")} />
      <div className="mt-4">
        <ConnectedApps />
      </div>
    </div>
  );
}
