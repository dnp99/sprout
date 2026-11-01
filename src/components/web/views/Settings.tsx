"use client";

import { PersonalSettings } from "@/components/settings/PersonalSettings";

/** Account identity/security/appearance live in the global avatar dialog. */
export function Settings() {
  return (
    <div className="mt-4">
      <PersonalSettings />
    </div>
  );
}
