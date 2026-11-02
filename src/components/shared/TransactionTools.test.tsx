import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { TransactionTools } from "./TransactionTools";
const mocks = vi.hoisted(() => ({ push: vi.fn(), set: vi.fn(), goMobile: vi.fn() }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/state/store", () => ({
  useStore: (select: (state: typeof mocks) => unknown) => select(mocks),
}));
let root: ReturnType<typeof createRoot>, container: HTMLDivElement;
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
function render(props: Parameters<typeof TransactionTools>[0]) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<TransactionTools {...props} />));
  return [...container.querySelectorAll("button")];
}
it("opens personal mobile workspaces without using group routes", () => {
  const buttons = render({ mobile: true });
  expect(buttons).toHaveLength(2);
  act(() => {
    buttons[0].click();
    buttons[1].click();
  });
  expect(mocks.goMobile.mock.calls).toEqual([["bills"], ["import"]]);
  expect(mocks.push).not.toHaveBeenCalled();
});
it("opens personal desktop workspaces through the view store", () => {
  const buttons = render({});
  act(() => buttons[1].click());
  expect(mocks.set).toHaveBeenCalledWith({ webView: "import" });
});
it("keeps group bills, imports and settlement in their group context", () => {
  const buttons = render({ groupId: "maple-house" });
  expect(buttons).toHaveLength(3);
  act(() => buttons.forEach((button) => button.click()));
  expect(mocks.push.mock.calls).toEqual([
    ["/groups/maple-house/bills"],
    ["/groups/maple-house/import"],
    ["/groups/maple-house/settlements"],
  ]);
  expect(mocks.set).not.toHaveBeenCalled();
  expect(mocks.goMobile).not.toHaveBeenCalled();
});
it("blocks workspace switching during pending group operations", () => {
  const buttons = render({ groupId: "maple-house", disabled: true });
  act(() => buttons.forEach((button) => button.click()));
  expect(mocks.push).not.toHaveBeenCalled();
});
