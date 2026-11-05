import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Tags, KeyRound } from "lucide-react";
import { SettingsWorkspace, settingsSectionFromHash } from "./SettingsWorkspace";

let desktop = false;
vi.mock("@/hooks/useDesktop", () => ({ useDesktop: () => desktop }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
let root: ReturnType<typeof createRoot>;
let container: HTMLDivElement;
function Draft() {
  const [value, setValue] = useState("");
  return (
    <>
      <input aria-label="Draft" value={value} onChange={(event) => setValue(event.target.value)} />
      <button onClick={() => setValue("Saved draft")}>Write draft</button>
    </>
  );
}
const sections = [
  { id: "categories", label: "Categories", icon: Tags, content: <Draft /> },
  {
    id: "connected-apps",
    label: "Personal capture",
    icon: KeyRound,
    content: <p>Capture setup</p>,
  },
];
beforeEach(() => {
  desktop = false;
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  Element.prototype.scrollIntoView = vi.fn();
  window.history.replaceState(null, "", "/settings");
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
const render = (busy = false) =>
  act(() => root.render(<SettingsWorkspace sections={sections} busy={busy} />));
function click(label: string) {
  const button = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
    (node) => node.textContent === label,
  )!;
  act(() => button.click());
}
it("keeps mobile destinations discoverable and preserves drafts across sections and resize", () => {
  render();
  expect(container.querySelector("input")!.closest("[hidden]")).not.toBeNull();
  click("Categories");
  click("Write draft");
  click("back");
  click("Personal capture");
  click("back");
  click("Categories");
  expect(container.querySelector("input")!.value).toBe("Saved draft");
  desktop = true;
  render();
  click("Personal capture");
  click("Categories");
  expect(container.querySelector("input")!.value).toBe("Saved draft");
  expect(window.location.hash).toBe("#settings-categories");
});
it("opens the legacy capture anchor and blocks section changes during group operations", () => {
  window.history.replaceState(null, "", "/settings#connected-apps");
  render(true);
  expect(container.querySelector('[aria-current="page"]')?.textContent).toBe("Personal capture");
  click("Categories");
  expect(container.querySelector('[aria-current="page"]')?.textContent).toBe("Personal capture");
  expect(window.location.hash).toBe("#connected-apps");
});
it("defaults desktop to the first panel and responds to fragment navigation", () => {
  desktop = true;
  render();
  expect(container.querySelector('[aria-current="page"]')?.textContent).toBe("Categories");
  act(() => {
    window.history.replaceState(null, "", "/settings#settings-connected-apps");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  expect(container.querySelector('[aria-current="page"]')?.textContent).toBe("Personal capture");
  expect(settingsSectionFromHash("#settings-unknown", ["categories"])).toBeNull();
});
