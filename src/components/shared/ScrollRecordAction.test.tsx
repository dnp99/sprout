import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { ScrollRecordAction } from "./ScrollRecordAction";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
let root: ReturnType<typeof createRoot>;
let container: HTMLDivElement;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.unstubAllGlobals();
});
function render(disabled = false) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const add = vi.fn();
  act(() => root.render(<ScrollRecordAction onClick={add} disabled={disabled} />));
  return add;
}
it("shows its floating action immediately and uses the existing add callback", () => {
  const add = render();
  const button = container.querySelector<HTMLButtonElement>(".calendar-add")!;
  expect(button).not.toBeNull();
  act(() => button.click());
  expect(add).toHaveBeenCalledOnce();
});
it("disables the floating entry point when the ledger cannot accept records", () => {
  const add = render(true);
  for (const button of container.querySelectorAll("button")) {
    expect(button.disabled).toBe(true);
    act(() => button.click());
  }
  expect(add).not.toHaveBeenCalled();
});
