import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { createStore } from "zustand/vanilla";
import { initialState } from "./initial";
import { groupSlice } from "./groups";
import type { AppStore } from "./types";
const response = (body: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;
const snapshot = (id: string) => ({ group: { id, revision: 3 } });
function store() {
  return createStore<AppStore>()(
    (set, get) =>
      ({
        ...initialState(),
        ...groupSlice(set, get),
        user: { ...initialState().user, id: "user-a" },
        flowStep: "done",
      }) as AppStore,
  );
}
beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
afterEach(() => vi.unstubAllGlobals());
it("sends full-ledger filters with every requested page", async () => {
  const s = store();
  vi.mocked(fetch).mockResolvedValue(response(snapshot("a")));
  await s
    .getState()
    .loadGroup("a", "2026-10", 1, { query: "shop & delivery", payer: "shared", scope: "all" });
  const url = new URL(String(vi.mocked(fetch).mock.calls[0][0]), "https://sprout.test");
  expect(Object.fromEntries(url.searchParams)).toEqual({
    month: "2026-10",
    page: "1",
    q: "shop & delivery",
    payer: "shared",
    scope: "all",
  });
});
it("ignores a stale group response after context switching", async () => {
  const s = store();
  let resolveA!: (v: Response) => void;
  vi.mocked(fetch)
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveA = resolve;
        }),
    )
    .mockResolvedValueOnce(response(snapshot("b")));
  const a = s.getState().loadGroup("a", "2026-10");
  await s.getState().loadGroup("b", "2026-10");
  resolveA(response(snapshot("a")));
  await a;
  expect(s.getState().groupData?.group.id).toBe("b");
});
it("clears household cache and ignores account-stale responses on logout", async () => {
  const s = store();
  let resolve!: (v: Response) => void;
  vi.mocked(fetch).mockImplementationOnce(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const loading = s.getState().loadGroup("a", "2026-10");
  s.getState().clearGroup();
  s.setState({ flowStep: "login", user: { ...s.getState().user, id: "other" } });
  resolve(response(snapshot("a")));
  await loading;
  expect(s.getState().groupData).toBeNull();
});
it("uses the original mutation key and revision when a network write is retried", async () => {
  const s = store();
  s.setState({ groupData: snapshot("a") as AppStore["groupData"] });
  vi.mocked(fetch)
    .mockRejectedValueOnce(new TypeError("network"))
    .mockResolvedValueOnce(response({ id: "saved" }));
  const operation = { type: "settings" as const, name: "Household", archived: false };
  await expect(s.getState().saveGroup(operation)).rejects.toThrow("network");
  s.setState({
    groupData: {
      ...s.getState().groupData!,
      group: { ...s.getState().groupData!.group, revision: 4 },
    },
  });
  await s.getState().saveGroup(operation);
  const first = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body)),
    second = JSON.parse(String(vi.mocked(fetch).mock.calls[1][1]?.body));
  expect(first.mutationId).toBe(second.mutationId);
  expect(second.revision).toBe(3);
});
it("revoked access removes previously cached records", async () => {
  const s = store();
  s.setState({ groupData: snapshot("a") as AppStore["groupData"] });
  vi.mocked(fetch).mockResolvedValueOnce(response({ error: "Removed" }, 404));
  await s.getState().loadGroup("a", "2026-10");
  expect(s.getState().groupData).toBeNull();
  expect(s.getState().groupError).toBe("Removed");
});

it("returns an expired session to login and clears household data", async () => {
  const s = store();
  s.setState({ groupData: snapshot("a") as AppStore["groupData"] });
  vi.mocked(fetch).mockResolvedValueOnce(response({ error: "Please sign in" }, 401));
  await s.getState().loadGroup("a", "2026-10");
  expect(s.getState().flowStep).toBe("login");
  expect(s.getState().groupData).toBeNull();
});
