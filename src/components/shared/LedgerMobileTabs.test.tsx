import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { LedgerMobileTabs } from "./LedgerMobileTabs";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
let root: ReturnType<typeof createRoot>;
let container: HTMLDivElement;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.unstubAllGlobals();
});
it("keeps Goals inside the Budget slot and ledger Settings at the right edge", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const select = vi.fn();
  act(() => root.render(<LedgerMobileTabs active="goals" onSelect={select} />));
  const buttons = [...container.querySelectorAll("button")];
  expect(buttons).toHaveLength(5);
  expect(buttons[2].textContent).toBe("budgetGoals");
  expect(buttons[2].getAttribute("aria-current")).toBe("page");
  expect(buttons[4].textContent).toBe("settings");
  act(() => buttons[4].click());
  expect(select.mock.calls[0][0].id).toBe("settings");
});
