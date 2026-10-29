import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { useGroupBulk } from "./useGroupBulk";
import type { GroupSnapshot } from "@/lib/groups/dto";
const mocks = vi.hoisted(() => ({ fetch: vi.fn(), download: vi.fn(), toast: vi.fn() }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/components/ui/Toast", () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock("@/lib/download", () => ({ downloadTextFile: mocks.download }));
vi.mock("@/state/groups", async (original) => ({
  ...(await original<typeof import("@/state/groups")>()),
  groupFetch: mocks.fetch,
}));
let root: ReturnType<typeof createRoot>,
  container: HTMLDivElement,
  api: ReturnType<typeof useGroupBulk>;
afterEach(() => {
  if (root) act(() => root.unmount());
  container?.remove();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
function start(refresh = vi.fn().mockResolvedValue(undefined)) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  const busy = vi.fn();
  function Test({ revision }: { revision: number }) {
    api = useGroupBulk({ group: { id: "source", revision } } as GroupSnapshot, refresh, busy);
    return null;
  }
  const render = (revision: number) => act(() => root.render(<Test revision={revision} />));
  render(3);
  return { render, refresh, busy };
}
const selected = [{ id: "entry", version: 0 }];
it("retries the exact request after a network failure even if the current group revision advances", async () => {
  const { render, busy } = start();
  mocks.fetch
    .mockRejectedValueOnce(new TypeError("Network failed"))
    .mockResolvedValueOnce({ count: 1 });
  const action = {
    action: "copy" as const,
    targetId: "target",
    targetRevision: 4,
    payerId: null,
    settlement: false,
  };
  await act(async () => {
    expect(await api.run(action, selected)).toBe(false);
  });
  const body = mocks.fetch.mock.calls[0][1];
  render(8);
  await act(async () => {
    expect(await api.run(action, selected)).toBe(true);
  });
  expect(mocks.fetch.mock.calls[1][1]).toEqual(body);
  expect(body.revision).toBe(3);
  expect(busy).toHaveBeenLastCalledWith(false);
});
it("does not retry a committed copy when refresh fails and exports only server-returned CSV", async () => {
  const refresh = vi.fn().mockRejectedValue(new Error("Refresh offline"));
  start(refresh);
  mocks.fetch
    .mockResolvedValueOnce({ count: 1 })
    .mockResolvedValueOnce({ count: 1, csv: "Date,Description\n2026-10-01,Selected" });
  await act(async () => {
    expect(await api.run({ action: "date", occurredOn: "2026-10-01" }, selected)).toBe(true);
  });
  await act(async () => {
    expect(await api.run({ action: "export" }, selected)).toBe(true);
  });
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(mocks.download).toHaveBeenCalledWith(
    "sprout-group-selected.csv",
    "Date,Description\n2026-10-01,Selected",
  );
});
