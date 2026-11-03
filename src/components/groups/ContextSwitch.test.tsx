import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ContextSwitch } from "./ContextSwitch";
const mocks = vi.hoisted(() => ({ push: vi.fn(), load: vi.fn(), record: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/transactions",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock("next/link", () => ({
  default: ({
    prefetch: _prefetch,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) => <a {...props} />,
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/state/store", () => ({
  useStore: (selector: (state: unknown) => unknown) =>
    selector({ groupList: [{ id: "maple" }], loadGroupList: mocks.load }),
}));
vi.mock("@/lib/groups/context-switch-motion", () => ({
  contextSwitchMotionOrigin: () => undefined,
  recordContextSwitch: mocks.record,
}));
let root: ReturnType<typeof createRoot>;
let container: HTMLDivElement;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
it.each(["cancelled", "disabled"])(
  "keeps %s navigation from moving or recording motion",
  async (reason) => {
    const guard = vi.fn(async () => false);
    act(() =>
      root.render(<ContextSwitch disabled={reason === "disabled"} beforeNavigate={guard} />),
    );
    await act(async () => {
      container.querySelectorAll("a")[1].click();
    });
    expect(mocks.push).not.toHaveBeenCalled();
    expect(mocks.record).not.toHaveBeenCalled();
    expect(mocks.load).not.toHaveBeenCalled();
    expect(guard).toHaveBeenCalledTimes(reason === "disabled" ? 0 : 1);
  },
);
it("records an approved switch while preserving section routing and active-link semantics", async () => {
  act(() => root.render(<ContextSwitch beforeNavigate={async () => true} />));
  expect(container.querySelector('[aria-current="page"]')?.textContent).toBe("personal");
  await act(async () => {
    container.querySelectorAll("a")[1].click();
  });
  expect(mocks.record).toHaveBeenCalledWith("personal", "group", "/groups/maple/transactions");
  expect(mocks.push).toHaveBeenCalledWith("/groups/maple/transactions");
  expect(mocks.load).not.toHaveBeenCalled();
});
