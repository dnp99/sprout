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
  act(() =>
    root.render(
      <EverydayCalendar
        month="2026-10"
        onMonthChange={() => {}}
        onViewAll={() => {}}
        onEdit={edit}
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
  expect(container.querySelector(".calendar-record-action")).toBeNull();
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
  const arrows = container.querySelectorAll(".calendar-week-grid .calendar-week-arrow");
  expect(arrows[0].nextElementSibling?.classList.contains("calendar-day")).toBe(true);
  expect(arrows[1].previousElementSibling?.classList.contains("calendar-day")).toBe(true);
  const monthToggle = [...container.querySelectorAll("button")].find(
    (button) => button.textContent === "month",
  )!;
  act(() => monthToggle.click());
  expect(container.querySelector(".calendar-week-arrow")).toBeNull();
  expect(container.querySelectorAll(".calendar-day")).toHaveLength(calendarDays("2026-09").length);
});
it("retains a non-interactive footer slot in Today and restores the Recent action", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const viewAll = vi.fn();
  act(() =>
    root.render(
      <EverydayCalendar
        month="2026-11"
        records={[]}
        onMonthChange={() => {}}
        onViewAll={viewAll}
      />,
    ),
  );
  const find = (text: string) =>
    [...container.querySelectorAll("button")].find((button) => button.textContent === text)!;
  const footer = find("viewAll");
  act(() => find("today").click());
  expect(find("viewAll")).toBe(footer);
  expect(footer.disabled).toBe(true);
  expect(footer.getAttribute("aria-hidden")).toBe("true");
  expect(footer.tabIndex).toBe(-1);
  act(() => footer.click());
  expect(viewAll).not.toHaveBeenCalled();
  act(() => find("recentTransactions").click());
  expect(footer.disabled).toBe(false);
  expect(footer.getAttribute("aria-hidden")).toBe("false");
  act(() => footer.click());
  expect(viewAll).toHaveBeenCalledTimes(1);
});

it("renders independent dashboard cards, caps recent rows, and keeps View all available after date selection", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const viewAll = vi.fn();
  act(() =>
    root.render(
      <EverydayCalendar
        dashboard
        month={today.slice(0, 7)}
        onMonthChange={vi.fn()}
        onViewAll={viewAll}
        records={Array.from({ length: 7 }, (_, i) => ({
          id: String(i),
          date: today,
          name: `Market ${i}`,
          category: "Food",
          payerLabel: "Paid by Alex",
          emoji: "",
          amountCents: -100,
          spendingCents: 100,
          incomeCents: 0,
        }))}
      />,
    ),
  );
  const cards = container.querySelectorAll(".dashboard-calendar-grid > .dashboard-card");
  expect(cards).toHaveLength(2);
  expect(cards[1].querySelectorAll(".record-row")).toHaveLength(5);
  expect(cards[1].textContent).toContain("Paid by Alex");
  expect(cards[1].querySelector("[style*=min-height]")).toBeNull();
  const selected = container.querySelector<HTMLButtonElement>(
    '.calendar-day[aria-pressed="true"]',
  )!;
  act(() => selected.click());
  const footer = [...container.querySelectorAll("button")].find(
    (b) => b.textContent === "viewAll",
  )!;
  expect(footer.disabled).toBe(false);
  act(() => footer.click());
  expect(viewAll).toHaveBeenCalledOnce();
});
