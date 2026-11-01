import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import type { GroupSnapshot } from "@/lib/groups/dto";
import { GroupCategorizeButton } from "./GroupCategorizeButton";
const run = vi.hoisted(() => vi.fn());
vi.mock("./useGroupBulk", () => ({ useGroupBulk: () => ({ run, busy: false, error: "" }) }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
let root: ReturnType<typeof createRoot>;
let container: HTMLDivElement;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.unstubAllGlobals();
  run.mockClear();
});
function render(data: GroupSnapshot) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <GroupCategorizeButton
        data={data}
        refresh={async () => {}}
        onBusyChange={() => {}}
        disabled={false}
      />,
    ),
  );
}
function fixture() {
  return {
    group: { id: "group" },
    categories: [{ id: "food", archived: false }],
    entries: [],
    reportEntries: [
      { id: "expense", kind: "expense", categoryId: null, merchant: "Maple Market", version: 3 },
      {
        id: "refund",
        kind: "refund",
        refundOf: "expense",
        categoryId: null,
        merchant: "Refund",
        version: 2,
      },
    ],
  } as unknown as GroupSnapshot;
}
it("categorizes full-report families even when absent from the current page", () => {
  render(fixture());
  act(() => container.querySelector("button")!.click());
  expect(run).toHaveBeenCalledWith({ action: "aiCategory" }, [
    { id: "expense", version: 3 },
    { id: "refund", version: 2 },
  ]);
});
it("hides for archived groups", () => {
  const data = fixture();
  data.group.archivedAt = "2026-11-01";
  render(data);
  expect(container.querySelector("button")).toBeNull();
});
it("hides when no active categories exist", () => {
  const data = fixture();
  data.categories = [];
  render(data);
  expect(container.querySelector("button")).toBeNull();
});
