import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import type { GroupSnapshot } from "@/lib/groups/dto";
import { GroupActivityHistory } from "./GroupActivityHistory";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
let root: ReturnType<typeof createRoot>;
let container: HTMLDivElement;
afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.unstubAllGlobals();
});
it("reveals ten older events at a time and stops at the latest hundred", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const data = {
    members: [],
    activity: Array.from({ length: 105 }, (_, i) => ({
      id: String(i),
      actorId: "former",
      action: "entryAdded",
      reason: `event-${i}`,
      createdAt: "2026-11-01T12:00:00Z",
    })),
  } as unknown as GroupSnapshot;
  act(() => root.render(<GroupActivityHistory data={data} locale="en-CA" />));
  const rows = () => container.querySelectorAll("strong").length;
  expect(rows()).toBe(10);
  act(() => container.querySelector("button")!.click());
  expect(rows()).toBe(20);
  expect(container.textContent).not.toContain("event-20");
  for (let i = 0; i < 8; i++) act(() => container.querySelector("button")!.click());
  expect(rows()).toBe(100);
  expect(container.querySelector("button")).toBeNull();
  expect(container.textContent).not.toContain("event-100");
});
