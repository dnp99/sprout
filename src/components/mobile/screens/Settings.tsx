"use client";

import { PersonalSettings } from "@/components/settings/PersonalSettings";

/** The bottom Settings destination configures this ledger; account preferences
 * are available from the avatar above the context switch on every main screen. */
export function Settings() {
  return (
    <div className="space-y-4 px-4 pb-4">
      <PersonalSettings mobile />
    </div>
  );
}
