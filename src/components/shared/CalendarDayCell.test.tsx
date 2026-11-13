import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { CalendarDayCell } from "./CalendarDayCell";
import { formatMoney } from "@/lib/format";
vi.mock("@/i18n/useFormatters", () => ({
  useFormatters: () => ({ locale: "en-CA", money: formatMoney }),
}));
let root: ReturnType<typeof createRoot>, host: HTMLDivElement;
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});
it("keeps exact credit amounts in accessible labels and native selection callbacks", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  const select = vi.fn();
  act(() =>
    root.render(
      <CalendarDayCell
        date="2026-11-13"
        label="Friday, November 13, 2026"
        spendingCents={-123456}
        hasRecords
        intensity={0}
        selected
        today
        outside={false}
        disabled={false}
        onSelect={select}
      />,
    ),
  );
  const button = host.querySelector("button")!;
  expect(button.getAttribute("aria-label")).toBe("Friday, November 13, 2026: −$1,234.56");
  expect(button.getAttribute("aria-pressed")).toBe("true");
  expect(button.getAttribute("data-intensity")).toBe("0");
  act(() => button.click());
  expect(select).toHaveBeenCalledWith("2026-11-13");
});
it("distinguishes a no-record dash from real zero-net activity", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  const render = (hasRecords: boolean) =>
    act(() =>
      root.render(
        <CalendarDayCell
          date="2026-11-13"
          label="Friday"
          spendingCents={0}
          hasRecords={hasRecords}
          intensity={0}
          selected={false}
          today={false}
          outside
          disabled={false}
          onSelect={vi.fn()}
        />,
      ),
    );
  render(false);
  expect(host.querySelector(".calendar-amount-empty")?.textContent).toBe("—");
  render(true);
  expect(host.querySelector(".calendar-amount-empty")).toBeNull();
  expect(host.querySelector(".calendar-money-label")?.textContent).toBe("$0");
  expect(host.querySelector("button")?.getAttribute("data-outside")).toBe("true");
});
it("prefers exact text or exact currency stacks before compacting and refits on resize", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  let available = 110;
  const updates = new Set<() => void>();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private update: () => void) {}
      observe() {
        updates.add(this.update);
      }
      disconnect() {
        updates.delete(this.update);
      }
    },
  );
  const client = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (
    this: HTMLElement,
  ) {
    return this.classList.contains("calendar-readable-amount") ? available : 0;
  });
  const rect = vi
    .spyOn(HTMLElement.prototype, "getBoundingClientRect")
    .mockImplementation(function (this: HTMLElement) {
      const index = this.hasAttribute("data-calendar-fit")
        ? [...this.parentElement!.children].indexOf(this)
        : -1;
      return {
        width: index < 0 ? 0 : [100, 80, 70, 60, 40, 30, 30][index],
        height: 0,
        x: 0,
        y: 0,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        toJSON: () => ({}),
      };
    });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  act(() =>
    root.render(
      <CalendarDayCell
        date="2026-11-13"
        label="Friday"
        spendingCents={12345}
        hasRecords
        intensity={1}
        selected={false}
        today={false}
        outside={false}
        disabled={false}
        onSelect={vi.fn()}
      />,
    ),
  );
  const format = () =>
    host.querySelector(".calendar-money-label")?.getAttribute("data-calendar-format");
  expect(format()).toBe("0");
  act(() => {
    available = 85;
    updates.forEach((update) => update());
  });
  expect(format()).toBe("1");
  act(() => {
    available = 75;
    updates.forEach((update) => update());
  });
  expect(format()).toBe("2");
  act(() => {
    available = 45;
    updates.forEach((update) => update());
  });
  expect(format()).toBe("4");
  expect(host.querySelector(".calendar-money-label")?.textContent).toContain("≈");
  expect(host.querySelector("button")?.getAttribute("aria-label")).toBe("Friday: $123.45");
  client.mockRestore();
  rect.mockRestore();
});
