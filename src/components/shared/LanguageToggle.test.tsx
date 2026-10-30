import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { LanguageToggle } from "./LanguageToggle";

const { set, refresh } = vi.hoisted(() => ({ set: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/state/store", () => ({
  useStore: (selector: (state: unknown) => unknown) => selector({ localePref: "en-CA", set }),
}));
const originalScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
let root: ReturnType<typeof createRoot>;
let container: HTMLDivElement;
afterEach(() => {
  if (root) act(() => root.unmount());
  container?.remove();
  document.cookie = "sprout-locale-pref=; max-age=0; path=/";
  if (originalScroll)
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", originalScroll);
  else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

it.each(["zh-Hans", "zh-Hant", "system"])(
  "persists %s and refreshes both UI surfaces",
  (locale) => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    act(() => root.render(<LanguageToggle compact />));
    const trigger = container.querySelector<HTMLButtonElement>('button[aria-haspopup="listbox"]')!;
    expect(trigger).not.toBeNull();
    act(() => trigger.click());
    const options = [...document.querySelectorAll<HTMLButtonElement>('[role="option"]')];
    expect(options).toHaveLength(5);
    const label = locale === "zh-Hans" ? "简体中文" : locale === "zh-Hant" ? "繁體中文" : "system";
    act(() => options.find((option) => option.textContent === label)!.click());
    expect(document.cookie).toContain(`sprout-locale-pref=${locale}`);
    expect(set).toHaveBeenCalledWith(
      locale === "system" ? { localePref: locale } : { localePref: locale, locale },
    );
    expect(refresh).toHaveBeenCalledOnce();
  },
);
