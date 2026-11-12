"use client";

import { Goals as LedgerGoals } from "@/components/web/views/Goals";

/** Both ledgers share actions and editors; the personal shell owns its title. */
export function Goals() {
  return (
    <div className="px-4">
      <LedgerGoals personalMobile />
    </div>
  );
}
