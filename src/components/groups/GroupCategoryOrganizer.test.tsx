import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { GroupCategoryOrganizer } from "./GroupCategoryOrganizer";
import type { GroupSnapshot } from "@/lib/groups/dto";
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) =>
    `${key}${values?.name ? ` ${values.name}` : ""}`,
}));
const data = {
  group: { revision: 3 },
  categories: [
    { id: "a", name: "Home", emoji: "🏠", color: "#123456", archived: false },
    { id: "b", name: "Food", emoji: "🛒", color: "#123456", archived: false },
  ],
} as GroupSnapshot;
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  if (root) act(() => root.unmount());
  container?.remove();
  vi.unstubAllGlobals();
});
function start() {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const run = vi.fn().mockResolvedValue({ id: "group" }),
    onDone = vi.fn();
  const render = (snapshot: GroupSnapshot) =>
    act(() =>
      root.render(
        <GroupCategoryOrganizer data={snapshot} run={run} busy={false} onDone={onDone} />,
      ),
    );
  render(data);
  return { run, onDone, render };
}
function click(label: string) {
  const b = [...container.querySelectorAll<HTMLButtonElement>("button")].find(
    (e) => e.textContent === label || e.getAttribute("aria-label") === label,
  )!;
  act(() => b.click());
}
function move() {
  click("treeDrag Food");
  const drop = container.querySelector<HTMLButtonElement>('[data-category-drop="move:a"]')!;
  act(() => drop.click());
}
it("keeps moves local until save-review plus a separate final confirmation", async () => {
  const { run, onDone } = start();
  move();
  expect(run).not.toHaveBeenCalled();
  click("treeSave");
  expect(run).not.toHaveBeenCalled();
  expect(container.querySelector("[data-category-drop]")).toBeNull();
  await act(async () => {
    [...container.querySelectorAll("button")].find((b) => b.textContent === "treeConfirm")!.click();
  });
  expect(run).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "categoryTree",
      expectedRevision: 3,
      draft: expect.objectContaining({
        nodes: expect.arrayContaining([expect.objectContaining({ id: "b", parentId: "a" })]),
      }),
    }),
  );
  expect(onDone).toHaveBeenCalledTimes(1);
});
it("undoes draft moves and returns from review without writing", () => {
  const { run } = start();
  move();
  click("treeUndo");
  expect(container.querySelector<HTMLButtonElement>("button.bg-primary")?.disabled).toBe(true);
  move();
  click("treeSave");
  click("treeBack");
  expect(container.querySelector('[data-category-drop="move:root"]')).not.toBeNull();
  expect(run).not.toHaveBeenCalled();
});
it("blocks a stale draft until explicit reload instead of adopting a new revision silently", () => {
  const { run, render } = start();
  move();
  render({ ...data, group: { ...data.group, revision: 4 } });
  const save = [...container.querySelectorAll("button")].find((b) => b.textContent === "treeSave")!;
  expect(save.disabled).toBe(true);
  expect(container.textContent).toContain("treeConflict");
  expect(run).not.toHaveBeenCalled();
});
