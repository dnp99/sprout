import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { SearchDialog } from "./SearchDialog";
import { SearchDateScope } from "./SearchDateScope";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/components/ui/Select", () => ({
  Select: (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} />,
}));
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
it("keeps search inline and reveals date filters without covering results", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const change = vi.fn();
  act(() =>
    root.render(
      <SearchDialog query="" onQueryChange={vi.fn()}>
        <SearchDateScope month="2026-02" onChange={change} />
      </SearchDialog>,
    ),
  );
  expect(container.querySelector('input[type="search"]')).not.toBeNull();
  expect(container.querySelector("select")).toBeNull();
  act(() => container.querySelector("button")!.click());
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  const select = container.querySelector("select")!;
  expect(select.value).toBe("all");
  act(() => {
    select.value = "month";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(change).toHaveBeenCalledWith("2026-02-01", "2026-02-28");
  expect(container.querySelector('input[type="month"]')).not.toBeNull();
  act(() => container.querySelector<HTMLButtonElement>('button[aria-label="close"]')!.click());
  expect(container.querySelector("select")).toBeNull();
  expect(container.querySelector('input[type="search"]')).not.toBeNull();
  expect(container.querySelector('[role="dialog"]')).toBeNull();
});

it("focuses the live field with the desktop shortcut while keeping results visible", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const change = vi.fn();
  act(() =>
    root.render(
      <>
        <SearchDialog query="market" shortcut onQueryChange={change}>
          <span>Advanced filters</span>
        </SearchDialog>
        <div role="status">3 matching records</div>
      </>,
    ),
  );
  act(() =>
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "/", bubbles: true, cancelable: true }),
    ),
  );
  expect(document.activeElement).toBe(container.querySelector('input[type="search"]'));
  expect(container.querySelector('[role="status"]')?.textContent).toBe("3 matching records");
  expect(container.textContent).not.toContain("Advanced filters");
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  act(() =>
    container.querySelector<HTMLButtonElement>('button[aria-label="clearSearch"]')!.click(),
  );
  expect(change).toHaveBeenCalledWith("");
});
