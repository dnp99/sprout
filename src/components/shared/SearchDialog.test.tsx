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
it("opens a compact search dialog with All dates by default and chooses a specific month", () => {
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
  expect(container.querySelector("input")).toBeNull();
  act(() => container.querySelector("button")!.click());
  expect(container.querySelector('[role="dialog"]')).not.toBeNull();
  const select = container.querySelector("select")!;
  expect(select.value).toBe("all");
  act(() => {
    select.value = "month";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(change).toHaveBeenCalledWith("2026-02-01", "2026-02-28");
  expect(container.querySelector('input[type="month"]')).not.toBeNull();
  act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
  expect(container.querySelector('[role="dialog"]')).toBeNull();
});
