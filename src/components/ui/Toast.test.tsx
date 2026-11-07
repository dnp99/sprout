import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from "./Toast";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
function Harness() {
  const { showToast } = useToast();
  return (
    <>
      <button onClick={() => showToast("Saved")}>Save</button>
      <button onClick={() => showToast("Failed", "error")}>Fail</button>
    </>
  );
}
function setup() {
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <ToastProvider>
        <Harness />
      </ToastProvider>,
    ),
  );
}
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("deduplicates success feedback without extending dismissal", () => {
  setup();
  act(() => container.querySelector("button")!.click());
  act(() => vi.advanceTimersByTime(3000));
  act(() => container.querySelector("button")!.click());
  expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
  act(() => vi.advanceTimersByTime(500));
  expect(container.querySelector('[role="status"]')).toBeNull();
});
it("pauses dismissal while keyboard focus is inside and resumes the remaining time", () => {
  setup();
  act(() => container.querySelector("button")!.click());
  act(() => vi.advanceTimersByTime(1000));
  act(() => container.querySelector<HTMLButtonElement>('[aria-label="dismiss"]')!.focus());
  act(() => vi.advanceTimersByTime(10000));
  expect(container.querySelector('[role="status"]')).not.toBeNull();
  act(() => container.querySelector<HTMLButtonElement>("button")!.focus());
  act(() => vi.advanceTimersByTime(2500));
  expect(container.querySelector('[role="status"]')).toBeNull();
});
it("announces errors assertively and gives them longer to read", () => {
  setup();
  act(() => container.querySelectorAll("button")[1].click());
  act(() => vi.advanceTimersByTime(3500));
  expect(container.querySelector('[role="alert"]')?.getAttribute("aria-live")).toBe("assertive");
  act(() => vi.advanceTimersByTime(4500));
  expect(container.querySelector('[role="alert"]')).toBeNull();
});
