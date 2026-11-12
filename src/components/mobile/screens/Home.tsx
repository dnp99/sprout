"use client";
import { PersonalOverview } from "@/components/overview/PersonalOverview";

/** The mobile shell retains account/context navigation and the record composer. */
export function Home() {
  return (
    <div className="px-4 pt-1.5">
      <PersonalOverview mobile />
    </div>
  );
}
