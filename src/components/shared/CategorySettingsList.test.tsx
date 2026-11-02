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
