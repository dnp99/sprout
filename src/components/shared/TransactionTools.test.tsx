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
it("opens personal mobile imports directly with an icon tooltip", () => {
  const buttons = render({ mobile: true });
  expect(buttons).toHaveLength(1);
  expect(buttons[0].textContent).toBe("");
  expect(buttons[0].getAttribute("title")).toBe("import");
  expect(buttons[0].getAttribute("aria-label")).toBe("import");
  expect(buttons[0].hasAttribute("aria-haspopup")).toBe(false);
  act(() => buttons[0].click());
  expect(mocks.goMobile).toHaveBeenCalledWith("import");
  expect(mocks.push).not.toHaveBeenCalled();
  expect(container.querySelector('[aria-expanded="true"]')).toBeNull();
});
it("omits the personal desktop import action now provided by the sidebar", () => {
  const buttons = render({});
  expect(buttons).toHaveLength(0);
});
it("keeps both mobile icon actions and tooltips inside their group context", () => {
  const buttons = render({ groupId: "maple-house", mobile: true });
  expect(buttons).toHaveLength(2);
  expect(buttons.map((button) => button.getAttribute("title"))).toEqual(["import", "settlements"]);
  expect(buttons.map((button) => button.getAttribute("aria-label"))).toEqual([
    "import",
    "settlements",
  ]);
  expect(buttons.every((button) => button.textContent === "")).toBe(true);
  act(() => buttons.forEach((button) => button.click()));
  expect(mocks.push.mock.calls).toEqual([
    ["/groups/maple-house/import"],
    ["/groups/maple-house/settlements"],
  ]);
  expect(mocks.goMobile).not.toHaveBeenCalled();
});
it("keeps only settlement in the desktop group toolbar", () => {
  const buttons = render({ groupId: "maple-house" });
  expect(buttons).toHaveLength(1);
  act(() => buttons[0].click());
  expect(mocks.push).toHaveBeenCalledWith("/groups/maple-house/settlements");
});
it.each([false, true])(
  "blocks workspace switching during pending group operations (mobile=%s)",
  (mobile) => {
    const buttons = render({ groupId: "maple-house", mobile, disabled: true });
    act(() => buttons.forEach((button) => button.click()));
    expect(mocks.push).not.toHaveBeenCalled();
  },
);
