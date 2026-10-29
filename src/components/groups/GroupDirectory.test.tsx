import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { GroupDirectory } from "./GroupDirectory";

const mocks = vi.hoisted(() => ({
  load: vi.fn().mockResolvedValue(undefined),
  push: vi.fn(),
  replace: vi.fn(),
  fetch: vi.fn(),
  list: [],
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
  useSearchParams: () => new URLSearchParams(location.search),
}));
vi.mock("@/state/store", () => ({
  useStore: (select: (state: unknown) => unknown) =>
    select({ groupList: mocks.list, loadGroupList: mocks.load }),
}));
vi.mock("@/state/groups", async (original) => ({
  ...(await original<typeof import("@/state/groups")>()),
  groupFetch: mocks.fetch,
}));

let root: ReturnType<typeof createRoot> | undefined;
let container: HTMLDivElement;
afterEach(() => {
  if (root) act(() => root!.unmount());
  container?.remove();
  history.replaceState(null, "", "/");
  sessionStorage.clear();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it("requires review of the named group before the prominent explicit acceptance", async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const token = "a".repeat(48);
  history.replaceState(null, "", `/groups?invite=${token}`);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root!.render(<GroupDirectory />));
  const button = (label: string) =>
    [...container.querySelectorAll<HTMLButtonElement>("button")].find(
      (el) => el.textContent === label,
    )!;
  const review = button("reviewInvite");
  expect(review.classList.contains("bg-primary")).toBe(true);
  expect(review.classList.contains("w-full")).toBe(true);
  expect(document.activeElement).toBe(review);
  expect(mocks.fetch).not.toHaveBeenCalled();
  mocks.fetch.mockResolvedValueOnce({ id: "group-id", name: "Our household" });
  await act(async () => {
    review.closest("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  expect(mocks.fetch).toHaveBeenLastCalledWith("/api/groups", { type: "preview", token });
  expect(container.textContent).toContain("Our household");
  expect(container.textContent).toContain("historyDisclosure");
  expect(mocks.push).not.toHaveBeenCalled();
  mocks.fetch.mockResolvedValueOnce({ id: "group-id" });
  await act(async () => {
    button("acceptInvite")
      .closest("form")!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  expect(mocks.fetch).toHaveBeenLastCalledWith("/api/groups", { type: "join", token });
  expect(mocks.push).toHaveBeenCalledWith("/groups/group-id");
});
