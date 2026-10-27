import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createStore } from "zustand/vanilla";
import { useStore as useZustandStore } from "zustand";
import { useRouteSync } from "./useRouteSync";

const routing = vi.hoisted(() => ({ pathname: "/transactions", push: vi.fn() }));
const navigation = { push: routing.push };
const store = createStore<{
  webView: string;
  mobileScreen: string;
  txnCategory: string;
  set: (patch: object) => void;
}>((set) => ({ webView: "transactions", mobileScreen: "history", txnCategory: "all", set }));
vi.mock("next/navigation", () => ({
  usePathname: () => routing.pathname,
  useRouter: () => navigation,
}));
vi.mock("@/state/store", () => ({
  useStore: (selector: (state: ReturnType<typeof store.getState>) => unknown) =>
    useZustandStore(store, selector),
}));
let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
function Harness({ enabled }: { enabled: boolean }) {
  useRouteSync(enabled);
  return null;
}
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  }));
  routing.push.mockClear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  store.setState({ webView: "transactions", mobileScreen: "history", txnCategory: "all" });
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
function visit(path: string, enabled = true) {
  routing.pathname = path;
  window.history.replaceState({}, "", path);
  act(() => root.render(<Harness enabled={enabled} />));
}
it("returning from Groups hydrates the incoming route without pushing stale Transactions", () => {
  visit("/transactions");
  visit("/groups", false);
  visit("/home");
  expect(store.getState().webView).toBe("overview");
  expect(routing.push).not.toHaveBeenCalled();
  act(() => store.setState({ webView: "transactions" }));
  expect(routing.push).toHaveBeenCalledExactlyOnceWith("/transactions");
});
it("incoming personal paths take precedence over stale store state", () => {
  visit("/transactions");
  visit("/settings");
  expect(store.getState().webView).toBe("settings");
  expect(routing.push).not.toHaveBeenCalled();
});
