import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { GroupSectionTitle } from "./GroupHeaderTitle";
vi.mock("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));
it.each([
  "overview",
  "transactions",
  "budget",
  "goals",
  "trends",
  "settings",
  "settlements",
  "import",
  "bills",
])("renders only the %s section title on mobile and web", (section) => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    act(() => root.render(<GroupSectionTitle section={section} />));
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(container.querySelector("h1")?.textContent).toBeTruthy();
    expect(container.textContent).not.toContain("groupContext");
    expect(container.querySelector("[role=combobox], select")).toBeNull();
    expect(container.children).toHaveLength(1);
  } finally {
    act(() => root.unmount());
    vi.unstubAllGlobals();
  }
});
