import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { TransactionRowActions } from "./TransactionRowActions";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/components/ui/Toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
function start(width: number, height: number) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("innerWidth", width);
  vi.stubGlobal("innerHeight", height);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const onEdit = vi.fn(),
    onDelete = vi.fn().mockResolvedValue(undefined);
  act(() =>
    root.render(
      <TransactionRowActions excluded onEdit={onEdit} onDelete={onDelete} onExclude={vi.fn()} />,
    ),
  );
  const trigger = container.querySelector<HTMLButtonElement>('button[aria-label="rowActions"]')!;
  trigger.getBoundingClientRect = () =>
    ({ left: width - 44, right: width - 4, top: height - 60, bottom: height - 16 }) as DOMRect;
  act(() => trigger.click());
  return { trigger, onEdit };
}
it.each([
  [1440, 900],
  [320, 568],
])("keeps labelled row actions inside a %i × %i viewport", (width, height) => {
  const { onEdit } = start(width, height);
  const menu = container.querySelector<HTMLDivElement>("div.fixed")!;
  expect(Number.parseFloat(menu.style.left)).toBeGreaterThanOrEqual(8);
  expect(Number.parseFloat(menu.style.left) + 224).toBeLessThanOrEqual(width - 8);
  expect(Number.parseFloat(menu.style.top) + 156).toBeLessThanOrEqual(height - 8);
  const buttons = [...menu.querySelectorAll("button")];
  expect(buttons.map((b) => b.textContent)).toEqual(["edit", "excludeFromBudget", "delete"]);
  expect(buttons[1].disabled).toBe(true);
  act(() => buttons[0].click());
  expect(onEdit).toHaveBeenCalledOnce();
  expect(container.querySelector("div.fixed")).toBeNull();
});
it("dismisses a detached popup when the ledger scrolls and supports Escape", () => {
  const { trigger } = start(320, 568);
  act(() => window.dispatchEvent(new Event("scroll")));
  expect(container.querySelector("div.fixed")).toBeNull();
  act(() => trigger.click());
  act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
  expect(container.querySelector("div.fixed")).toBeNull();
});
