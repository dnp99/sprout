import { act } from "react";
import { createRoot } from "react-dom/client";
import type { SelectHTMLAttributes } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { GroupHeaderTitle } from "./GroupHeaderTitle";
import type { GroupListItem } from "@/lib/groups/dto";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/components/ui/Select", () => ({
  Select: ({
    variant: _variant,
    ...props
  }: SelectHTMLAttributes<HTMLSelectElement> & { variant?: string }) => <select {...props} />,
}));
let root: ReturnType<typeof createRoot>;
let container: HTMLDivElement;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.unstubAllGlobals();
});
function render(count: number, disabled = false) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const groups: GroupListItem[] = Array.from({ length: count }, (_, i) => ({
    id: String(i),
    name: `Maple House ${i}`,
    revision: 1,
    archivedAt: null,
    memberId: "member",
    role: "owner",
  }));
  const change = vi.fn();
  act(() =>
    root.render(
      <GroupHeaderTitle
        id="0"
        name="Maple House 0"
        groups={groups}
        disabled={disabled}
        onChange={change}
      />,
    ),
  );
  return change;
}
it("uses the group name rather than a Home heading for a single group", () => {
  render(1);
  expect(container.querySelector("h1")?.textContent).toBe("Maple House 0");
  expect(container.querySelector("select")).toBeNull();
});
it("switches through the existing group route callback when more than one group exists", () => {
  const change = render(2);
  const select = container.querySelector("select")!;
  act(() => {
    select.value = "1";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(change).toHaveBeenCalledWith("1");
});
it("disables group switching during a pending ledger operation", () => {
  render(2, true);
  expect(container.querySelector("select")?.disabled).toBe(true);
});
