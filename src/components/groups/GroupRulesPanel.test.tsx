import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { GroupRulesPanel } from "./GroupRulesPanel";
import type { GroupSnapshot } from "@/lib/groups/dto";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/components/ui/Select", () => ({
  Select: (props: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} />,
}));
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.unstubAllGlobals();
});
const fixture = () =>
  ({
    group: { role: "member", archivedAt: null },
    categories: [{ id: "food", name: "Groceries", archived: false }],
    merchantRules: [
      { id: "rule", pattern: "MAPLE MARKET", label: "Maple Market", categoryId: "food" },
    ],
  }) as unknown as GroupSnapshot;
function render(data: GroupSnapshot, run = vi.fn().mockResolvedValue({ id: "rule" })) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<GroupRulesPanel data={data} run={run} busy={false} />));
  return run;
}
function button(text: string) {
  return [...container.querySelectorAll("button")].find(
    (b) => b.textContent === text || b.getAttribute("aria-label") === text,
  )!;
}
it("lets a regular member edit the shared rule and preserves its identity", async () => {
  const run = render(fixture());
  act(() => button("edit").click());
  expect(container.querySelector("input")?.value).toBe("Maple Market");
  await act(async () => {
    container
      .querySelector("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  expect(run).toHaveBeenCalledWith({
    type: "merchantRule",
    id: "rule",
    merchant: "Maple Market",
    categoryId: "food",
  });
  expect(container.querySelector("input")?.value).toBe("");
});
it("shows delete errors without discarding the shared rule", async () => {
  const run = vi.fn().mockRejectedValue(new Error("Offline"));
  render(fixture(), run);
  await act(async () => button("delete").click());
  expect(run).not.toHaveBeenCalled();
  await act(async () =>
    document.querySelectorAll<HTMLButtonElement>('[role="alertdialog"] button')[1].click(),
  );
  expect(run).toHaveBeenCalledWith({ type: "merchantRuleDelete", id: "rule" });
  expect(container.querySelector('[role="alert"]')?.textContent).toBe("Offline");
  expect(container.textContent).toContain("Maple Market");
});
it("keeps archived rules visible but disables mutation controls", () => {
  const data = fixture();
  data.group.archivedAt = "2026-11-01";
  render(data);
  expect(container.querySelector("fieldset")?.disabled).toBe(true);
  expect(button("edit").disabled).toBe(true);
  expect(button("delete").disabled).toBe(true);
});
