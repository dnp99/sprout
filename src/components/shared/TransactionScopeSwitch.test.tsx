import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import type { TransactionScope } from "@/lib/transactions/scoped-filter";
import { TransactionScopeSwitch } from "./TransactionScopeSwitch";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
let root: ReturnType<typeof createRoot>;
let container: HTMLDivElement;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.unstubAllGlobals();
});
function Host() {
  const [scope, setScope] = useState<TransactionScope>("all");
  return <TransactionScopeSwitch value={scope} onChange={setScope} />;
}
it("starts at All and supports tap, arrow keys and horizontal swipes without reacting to vertical scrolling", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<Host />));
  const selected = () => container.querySelector('[aria-pressed="true"]')?.textContent;
  expect(selected()).toBe("chipAll");
  act(() => container.querySelectorAll("button")[1].click());
  expect(selected()).toBe("chipExpense");
  const group = container.querySelector('[role="group"]')!;
  act(() =>
    group.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })),
  );
  expect(selected()).toBe("chipIncome");
  const touch = (name: string, x: number, y: number) =>
    act(() =>
      group.dispatchEvent(
        Object.assign(new Event(name, { bubbles: true }), {
          [name === "touchstart" ? "touches" : "changedTouches"]: [{ clientX: x, clientY: y }],
        }),
      ),
    );
  touch("touchstart", 10, 10);
  touch("touchend", 80, 15);
  expect(selected()).toBe("chipExpense");
  touch("touchstart", 10, 10);
  touch("touchend", 15, 100);
  expect(selected()).toBe("chipExpense");
});
