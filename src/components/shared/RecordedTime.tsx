"use client";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";

/** Actual entry time is secondary metadata, distinct from its reporting date. */
export function RecordedTime({ value }: { value?: string }) {
  const locale = useStore((s) => s.locale);
  const t = useTranslations("dates");
  if (!value || !isFinite(Date.parse(value))) return null;
  const date = new Date(value);
  return (
    <time
      dateTime={value}
      title={date.toLocaleString(locale)}
      className="block text-[10px] font-normal leading-4 text-subtle"
    >
      {t("recordedAt", {
        time: date.toLocaleString(locale, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      })}
    </time>
  );
}
