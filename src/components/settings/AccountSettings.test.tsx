import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { AccountSettings } from "./AccountSettings";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/state/store", () => ({
  useStore: (select: (state: unknown) => unknown) =>
    select({ user: { name: "Alex", email: "alex@example.test" }, themePref: "system" }),
}));
vi.mock("./VisualThemePicker", () => ({ VisualThemePicker: () => <div>themes</div> }));
vi.mock("./NotificationSettings", () => ({ NotificationSettings: () => <div>notifications</div> }));
vi.mock("@/components/shared/LanguageToggle", () => ({
  LanguageToggle: () => <div>language</div>,
}));
let root: ReturnType<typeof createRoot>;
let container: HTMLDivElement;
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
it("switches desktop sections and mobile disclosures without submitting security actions", () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<AccountSettings section="security" />));
  const navigation = container.querySelector("nav")!;
  expect(navigation.querySelector('[aria-current="page"]')?.textContent).toBe("security");
  const disclosures = container.querySelectorAll<HTMLButtonElement>("button[aria-expanded]");
  expect(disclosures[1].getAttribute("aria-expanded")).toBe("true");
  expect(container.querySelector("details")?.open).toBe(false);
  act(() => disclosures[2].click());
  expect(disclosures[1].getAttribute("aria-expanded")).toBe("false");
  expect(disclosures[2].getAttribute("aria-expanded")).toBe("true");
  act(() => disclosures[2].click());
  expect(disclosures[2].getAttribute("aria-expanded")).toBe("false");
  act(() => navigation.querySelectorAll<HTMLButtonElement>("button")[0].click());
  expect(navigation.querySelector('[aria-current="page"]')?.textContent).toBe("accountProfile");
  expect(fetch).not.toHaveBeenCalled();
});
