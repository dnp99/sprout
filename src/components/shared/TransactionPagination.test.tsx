import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { TransactionPagination } from "./TransactionPagination";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
function start(count: number, page = 0, disabled = false) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const onChange = vi.fn();
  act(() =>
    root.render(
      <TransactionPagination count={count} page={page} disabled={disabled} onChange={onChange} />,
    ),
  );
  return onChange;
}
it.each([0, 1, 50])("hides pagination for %i results", (count) => {
  start(count);
  expect(container.querySelector("nav")).toBeNull();
});
it("shows result ranges and disables the unavailable direction", () => {
  const onChange = start(124, 2);
  expect(container.textContent).toContain("101–124 / 124");
  const previous = container.querySelector<HTMLButtonElement>('[aria-label="previous"]')!;
  const next = container.querySelector<HTMLButtonElement>('[aria-label="next"]')!;
  expect(next.disabled).toBe(true);
  act(() => previous.click());
  expect(onChange).toHaveBeenCalledWith(1);
});
it("prevents paging while a request is pending", () => {
  start(124, 1, true);
  expect([...container.querySelectorAll("button")].every((button) => button.disabled)).toBe(true);
});
