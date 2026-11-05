import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import type { GroupSnapshot } from "@/lib/groups/dto";
import { GroupBulkActions } from "./GroupBulkActions";
const run = vi.hoisted(() => vi.fn());
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/state/store", () => ({
  useStore: (select: (s: unknown) => unknown) => select({ groupList: [] }),
}));
vi.mock("./useGroupBulk", () => ({ useGroupBulk: () => ({ run, busy: false, error: "" }) }));
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  run.mockClear();
});
it("keeps desktop selection compact and opens one focused action dialog without running a mutation", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const matches = vi.fn();
  act(() =>
    root.render(
      <GroupBulkActions
        compact
        onSelectMatches={matches}
        data={{ group: { id: "g" }, categories: [] } as unknown as GroupSnapshot}
        selection={[
          { id: "a", version: 0 },
          { id: "b", version: 0 },
        ]}
        refresh={vi.fn()}
        onBusyChange={vi.fn()}
        onClear={vi.fn()}
      />,
    ),
  );
  const click = (label: string) =>
    act(() =>
      [...document.querySelectorAll<HTMLButtonElement>("button")]
        .find((b) => b.textContent?.trim() === label)!
        .click(),
    );
  expect(container.querySelector(".group-bulk-compact")).not.toBeNull();
  expect(container.querySelector("input")).toBeNull();
  expect(container.textContent).not.toContain("bulkExport");
  click("more");
  click("bulkSelectMatches");
  expect(matches).toHaveBeenCalledOnce();

  expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
  click("bulkDate");
  expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
  expect(document.querySelector('input[type="date"]')).not.toBeNull();
  expect(run).not.toHaveBeenCalled();
});
