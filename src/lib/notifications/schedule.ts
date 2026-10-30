/** Calendar parts avoid fixed UTC offsets, so Sunday evening follows daylight saving. */
export function weeklyReminderKey(now: Date, timeZone: string): string | null {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const part = (type: string) => parts.find((p) => p.type === type)?.value;
    // The hourly scheduler may be delayed; allow the same evening until midnight.
    if (part("weekday") !== "Sun" || Number(part("hour")) < 19) return null;
    return `weekly:${part("year")}-${part("month")}-${part("day")}`;
  } catch {
    return null;
  }
}
