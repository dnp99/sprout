import { expect, it } from "vitest";
import { categoryChartColor, payerChartColor } from "./chart-colors";

it("resolves legacy accents through theme tokens with a saved-color fallback", () => {
  expect(categoryChartColor("#C98A5A")).toBe(
    "color-mix(in srgb, var(--chart-category-1, #C98A5A) 82%, var(--card))",
  );
});

it("preserves custom accents and existing semantic colors", () => {
  expect(categoryChartColor("#123456")).toBe("color-mix(in srgb, #123456 82%, var(--card))");
  expect(categoryChartColor("var(--primary)")).toContain("var(--primary) 82%");
});

it("assigns payer series independently of category colors", () => {
  expect(payerChartColor(0)).toBe(payerChartColor(6));
  expect(payerChartColor(1)).not.toBe(payerChartColor(0));
});
