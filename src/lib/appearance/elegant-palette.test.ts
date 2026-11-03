import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");
const body = css.match(/:root\.dark\[data-visual-theme="elegant"\] \{([^}]+)\}/)![1];
const palette = Object.fromEntries(
  [...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]),
);
function resolve(key: string): string {
  const value = palette[key];
  const alias = /^var\((--[\w-]+)\)$/.exec(value);
  return alias ? resolve(alias[1]) : value;
}
function luminance(hex: string) {
  return [1, 3, 5]
    .map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
}
function contrast(foreground: string, background: string) {
  const values = [luminance(resolve(foreground)), luminance(resolve(background))].sort(
    (a, b) => a - b,
  );
  return (values[1] + 0.05) / (values[0] + 0.05);
}
it("keeps Elegant dark text readable on neutral, selected and gold surfaces", () => {
  for (const foreground of ["--fg", "--muted", "--primary-ink"]) {
    for (const background of ["--bg", "--card", "--primary-soft", "--panel-lemon"]) {
      expect(
        contrast(foreground, background),
        `${foreground} on ${background}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  }
  for (const foreground of ["--rail-ink", "--sidebar-muted", "--rail-accent"]) {
    for (const background of ["--sidebar", "--rail-soft", "--rail-hover"]) {
      expect(
        contrast(foreground, background),
        `${foreground} on ${background}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  }
});
it("keeps action and calendar ink accessible through hover and pressed states", () => {
  for (const background of ["--cta", "--cta-hover", "--cta-active"]) {
    expect(contrast("--oncta", background)).toBeGreaterThanOrEqual(4.5);
  }
  expect(contrast("--add-fg", "--primary")).toBeGreaterThanOrEqual(4.5);
  expect(contrast("--calendar-accent-ink", "--calendar-accent")).toBeGreaterThanOrEqual(4.5);
  for (const background of ["--bg", "--card", "--primary-soft"]) {
    expect(contrast("--rail-accent", background)).toBeGreaterThanOrEqual(3);
  }
});

it("keeps essential field boundaries distinguishable from dark surfaces", () => {
  for (const background of ["--bg", "--card", "--primary-soft", "--rail-soft"]) {
    expect(contrast("--control-border", background)).toBeGreaterThanOrEqual(3);
  }
});
