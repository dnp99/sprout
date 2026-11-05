import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { CategorySettingsList } from "./CategorySettingsList";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: { name: string }) => `${key} ${values?.name ?? ""}`,
}));

it("nests children below their parent and distinguishes identical child edit actions by path", () => {
  const categories = [
    { id: "a", name: "Car", emoji: "🚗", color: "#c98a5a" },
    { id: "b", name: "Tickets", parentId: "a", emoji: "⚠️", color: "#c98a5a" },
    { id: "c", name: "Fun", emoji: "🎬", color: "#c98a5a" },
    { id: "d", name: "Tickets", parentId: "c", emoji: "🎟️", color: "#c98a5a" },
  ];
  const html = renderToStaticMarkup(
    createElement(CategorySettingsList, { categories, onEdit: vi.fn() }),
  );
  const container = document.createElement("div");
  container.innerHTML = html;
  expect(container.querySelectorAll('[role="group"]')).toHaveLength(2);
  expect(container.querySelector('[aria-label="Car"] .border-l')?.textContent).toBe("Tickets");
  expect(
    container.querySelector('button[aria-label="editCategoryNamed Car / Tickets"]'),
  ).not.toBeNull();
  expect(
    container.querySelector('button[aria-label="editCategoryNamed Fun / Tickets"]'),
  ).not.toBeNull();
});

it("searches child paths, keeps their parent, and expands matching children", async () => {
  const { act } = await import("react");
  const { createRoot } = await import("react-dom/client");
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    act(() =>
      root.render(
        createElement(CategorySettingsList, {
          categories: [
            { id: "a", name: "Car", emoji: "🚗", color: "#c98a5a" },
            { id: "b", name: "Tickets", parentId: "a", emoji: "⚠️", color: "#c98a5a" },
            { id: "c", name: "Fun", emoji: "🎬", color: "#c98a5a" },
          ],
          onEdit: vi.fn(),
        }),
      ),
    );
    expect(container.querySelector("details")?.open).toBe(false);
    const input = container.querySelector("input")!;
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
        input,
        "Car / Tickets",
      );
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(container.querySelectorAll('[role="group"]')).toHaveLength(1);
    expect(container.querySelector('[aria-label="Car"]')).not.toBeNull();
    expect(container.querySelector("details")?.open).toBe(true);
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
        input,
        "Missing",
      );
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(container.querySelectorAll('[role="group"]')).toHaveLength(0);
    expect(container.textContent).toContain("noCategories");
  } finally {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  }
});
