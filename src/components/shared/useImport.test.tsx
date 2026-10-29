import { act, createRef, useImperativeHandle } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useImport, type ImportTarget } from "./useImport";
const mocks = vi.hoisted(() => ({ refresh: vi.fn(), categories: [] }));
vi.mock("@/state/store", () => ({
  useStore: (select: (state: unknown) => unknown) => select(mocks),
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
const csv =
  "Date,Description,Amount,Source,Transaction Type,Category\n2026-10-01,Market,-12,Bank,Expense,Groceries";
const file = { name: "sprout-template.csv", text: async () => csv } as File;
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("fetch", vi.fn());
  mocks.refresh.mockReset();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
const summary = {
  imported: 1,
  excluded: 0,
  reconciled: 0,
  accounts: 0,
  uncategorized: 0,
  aiCategorized: 0,
};
function render(target?: ImportTarget) {
  const ref = createRef<ReturnType<typeof useImport>>();
  function Harness() {
    const value = useImport(target);
    useImperativeHandle(ref, () => value);
    return null;
  }
  act(() => root.render(<Harness />));
  return ref;
}
it("posts group data only to its target, preserves retry identity and refreshes only that group", async () => {
  const onSuccess = vi.fn().mockResolvedValue(undefined);
  const ref = render({
    group: true,
    endpoint: "/api/groups/group-id/import",
    categoryNames: ["Groceries"],
    extraBody: { payerId: "payer", revision: 3, settlement: true },
    onSuccess,
  });
  await act(async () => ref.current!.onFile(file));
  vi.mocked(fetch).mockRejectedValueOnce(new TypeError("network"));
  await act(async () => {
    expect(await ref.current!.doImport()).toBe(false);
  });
  vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => summary } as Response);
  await act(async () => {
    expect(await ref.current!.doImport()).toBe(true);
  });
  const bodies = vi
    .mocked(fetch)
    .mock.calls.map(([, options]) => JSON.parse(String(options?.body)));
  expect(bodies[0].mutationId).toBe(bodies[1].mutationId);
  expect(bodies[1]).toMatchObject({
    payerId: "payer",
    revision: 3,
    settlement: true,
    preset: "sprout",
  });
  expect(vi.mocked(fetch).mock.calls.map(([url]) => url)).toEqual([
    "/api/groups/group-id/import",
    "/api/groups/group-id/import",
  ]);
  expect(onSuccess).toHaveBeenCalledOnce();
  expect(mocks.refresh).not.toHaveBeenCalled();
});
it("keeps the personal endpoint and refresh behavior when no target is provided", async () => {
  const ref = render();
  await act(async () => ref.current!.onFile(file));
  vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => summary } as Response);
  await act(async () => {
    expect(await ref.current!.doImport()).toBe(true);
  });
  expect(vi.mocked(fetch).mock.calls[0][0]).toBe("/api/import");
  expect(mocks.refresh).toHaveBeenCalledOnce();
});
