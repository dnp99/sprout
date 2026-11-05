import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { ReportPeriodControl } from "./ReportPeriodControl";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/i18n/useFormatters", () => ({
  useFormatters: () => ({ monthKey: (value: string) => value }),
}));
let root: ReturnType<typeof createRoot>;
let container: HTMLDivElement;
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
function render() {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const change = vi.fn();
  act(() => root.render(<ReportPeriodControl period="month" month="2026-10" onChange={change} />));
  return change;
}
function click(text: string) {
  const button = [...container.querySelectorAll("button")].find((row) => row.textContent === text);
  if (!button) throw Error(`Missing ${text}`);
  act(() => button.click());
}
it("reopens the active Month button and offers month selection without days", () => {
  render();
  click("periodMonthShort");
  expect(container.querySelector('input[type="month"]')?.getAttribute("value")).toBe("2026-10");
  expect(container.querySelector('input[type="date"]')).toBeNull();
  expect(container.querySelector('[role="dialog"]')).not.toBeNull();
});
it("applies a rolling six-month range only after confirmation", () => {
  const change = render();
  click("period6mShort");
  expect(container.textContent).toContain("2026-05 – 2026-10");
  expect(change).not.toHaveBeenCalled();
  click("apply");
  expect(change).toHaveBeenCalledWith("6m", "2026-10");
  expect(container.querySelector('[role="dialog"]')).toBeNull();
});
it("offers a year field for YTD and closes with Escape without applying", () => {
  const change = render();
  click("periodYtdShort");
  expect(container.querySelector('input[type="number"]')).not.toBeNull();
  act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  expect(change).not.toHaveBeenCalled();
});
it("restores focus after nested label clicks and still reopens the selected period", () => {
  render();
  const month = container.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')!;
  act(() => month.querySelector<HTMLElement>(".choice-label")!.click());
  const input = container.querySelector<HTMLInputElement>("input")!;
  act(() => input.focus());
  act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
  expect(document.activeElement).toBe(month);
  act(() => month.querySelector<HTMLElement>(".choice-label")!.click());
  expect(container.querySelector('[role="dialog"]')).not.toBeNull();
});
