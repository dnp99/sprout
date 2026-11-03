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
it("opens personal mobile imports from More without using group routes", () => {
  const buttons = render({ mobile: true });
  expect(buttons).toHaveLength(1);
  expect(buttons[0].textContent).toBe("");
  expect(buttons[0].getAttribute("title")).toBe("more");
  expect(buttons[0].getAttribute("aria-haspopup")).toBe("true");
  act(() => buttons[0].click());
  const item = [...container.querySelectorAll("button")].find(
    (button) => button.textContent === "import",
  )!;
  act(() => item.click());
  expect(mocks.goMobile).toHaveBeenCalledWith("import");
  expect(mocks.push).not.toHaveBeenCalled();
  expect(container.querySelector('[aria-expanded="true"]')).toBeNull();
});
it("omits the personal desktop import action now provided by the sidebar", () => {
  const buttons = render({});
  expect(buttons).toHaveLength(0);
});
it("keeps mobile More actions inside their group context", () => {
  const buttons = render({ groupId: "maple-house", mobile: true });
  act(() => buttons[0].click());
  const imports = [...container.querySelectorAll("button")].find(
    (button) => button.textContent === "import",
  )!;
  act(() => imports.click());
  act(() => container.querySelector<HTMLButtonElement>('[aria-label="more"]')!.click());
  const settle = [...container.querySelectorAll("button")].find(
    (button) => button.textContent === "settlements",
  )!;
  act(() => settle.click());
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
it("blocks workspace switching during pending group operations", () => {
  const buttons = render({ groupId: "maple-house", disabled: true });
  act(() => buttons.forEach((button) => button.click()));
  expect(mocks.push).not.toHaveBeenCalled();
});
