"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import type { GroupSnapshot } from "@/lib/groups/dto";
import { Panel, buttonClass } from "./ui";

/** Reveal audit history locally so loading older events never interrupts current edits. */
export function GroupActivityHistory({ data, locale }: { data: GroupSnapshot; locale: string }) {
  const t = useTranslations("groups");
  const [visible, setVisible] = useState(10);
  // The server already returns newest-first history capped at 100; also cap at the view boundary.
  const events = data.activity.slice(0, 100);
  const limit = visible;
  return (
    <Panel tone="peach">
      <h2 className="font-bold">{t("activity")}</h2>
      <div className="mt-3 space-y-3">
        {events.slice(0, limit).map((event) => (
          <div key={event.id} className="text-xs">
            <strong>
              {data.members.find((member) => member.id === event.actorId)?.name ??
                t("formerMember")}
            </strong>{" "}
            · {t(`events.${event.action}`)}
            {event.reason && <p className="mt-1 text-muted">{event.reason}</p>}
            <p className="mt-1 text-muted">{new Date(event.createdAt).toLocaleString(locale)}</p>
          </div>
        ))}
      </div>
      {limit < events.length && (
        <button
          type="button"
          className={`${buttonClass} mt-4 w-full`}
          onClick={() => setVisible((count) => Math.min(count + 10, 100))}
        >
          {t("activityLoadMore")} <ChevronDown size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </Panel>
  );
}
