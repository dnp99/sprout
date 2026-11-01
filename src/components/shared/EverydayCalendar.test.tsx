import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { EverydayCalendar } from "./EverydayCalendar";
import { calendarDays } from "@/lib/calendar";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/i18n/useFormatters", () => ({
  useFormatters: () => ({
    locale: "en-CA",
    monthKey: (v: string) => v,
    money: (v: number) => String(v),
  }),
}));
vi.mock("./RecordedTime", () => ({ RecordedTime: () => null }));
let root: ReturnType<typeof createRoot>;
let container: HTMLDivElement;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.unstubAllGlobals();
});
it("starts with seven days, switches to the full month, and retains note/edit access", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const edit = vi.fn();
  const add = vi.fn();
  act(() =>
    root.render(
      <EverydayCalendar
        month="2026-10"
        onMonthChange={() => {}}
        onViewAll={() => {}}
        onEdit={edit}
        onAdd={add}
        records={[
          {
            id: "one",
            date: "2026-10-01",
            name: "Maple Market",
            category: "Food",
            note: "Lunch",
            emoji: "",
            amountCents: -1200,
            spendingCents: 1200,
            incomeCents: 0,
          },
        ]}
      />,
    ),
  );
  expect(container.querySelectorAll(".calendar-day")).toHaveLength(7);
  expect(container.querySelector(".calendar-add")).toBeNull();
  expect(container.querySelector("h2")).toBeNull();
  expect(container.textContent).not.toContain("hint");
  act(() => container.querySelector<HTMLButtonElement>(".calendar-record-action")!.click());
  expect(add).toHaveBeenCalledWith("2026-10-01");
  expect(
    container.querySelector('.calendar-segments button[aria-pressed="true"]')?.textContent,
  ).toBe("week");
  const month = [...container.querySelectorAll("button")].find((b) => b.textContent === "month")!;
  act(() => month.click());
  expect(container.querySelectorAll(".calendar-day")).toHaveLength(calendarDays("2026-10").length);
  expect(container.querySelector('[title="Food · Lunch · 2026-10-01"]')).not.toBeNull();
  act(() => container.querySelector<HTMLButtonElement>(".record-row")!.click());
  expect(edit).toHaveBeenCalledWith("one");
});

function ControlledCalendar() {
  const [month, setMonth] = useState("2026-10");
  return (
    <EverydayCalendar month={month} onMonthChange={setMonth} onViewAll={() => {}} records={[]} />
  );
}
it("keeps month arrows month-scoped and date-row arrows week-scoped across month boundaries", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<ControlledCalendar />));
  const click = (label: string) =>
    act(() => container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!.click());
  click("nextMonth");
  expect(container.textContent).toContain("2026-11");
  expect(
    container.querySelector('.calendar-day[aria-pressed="true"] .calendar-day-number')?.textContent,
  ).toBe("1");
  click("nextWeek");
  expect(
    container.querySelector('.calendar-day[aria-pressed="true"] .calendar-day-number')?.textContent,
  ).toBe("8");
  click("previousMonth");
  expect(container.textContent).toContain("2026-10");
  expect(
    container.querySelector('.calendar-day[aria-pressed="true"] .calendar-day-number')?.textContent,
  ).toBe("1");
  click("previousWeek");
  expect(container.textContent).toContain("2026-09");
  expect(
    container.querySelector('.calendar-day[aria-pressed="true"] .calendar-day-number')?.textContent,
  ).toBe("24");
  const arrows = container.querySelectorAll(".calendar-week-arrow");
  expect(arrows[0].nextElementSibling?.classList.contains("calendar-day")).toBe(true);
  expect(arrows[1].previousElementSibling?.classList.contains("calendar-day")).toBe(true);
  const monthToggle = [...container.querySelectorAll("button")].find(
    (button) => button.textContent === "month",
  )!;
  act(() => monthToggle.click());
  expect(container.querySelector(".calendar-week-arrow")).toBeNull();
  expect(container.querySelectorAll(".calendar-day")).toHaveLength(calendarDays("2026-09").length);
});
