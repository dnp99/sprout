import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const css = readFileSync("src/app/vibrant-theme.css", "utf8");
const blocks = [...css.matchAll(/:root[^\{]* \{([^}]+)\}/g)];
const tokens = (body: string) =>
  Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const light = tokens(blocks[0][1]);
const dark = { ...light, ...tokens(blocks[1][1]) };
function resolve(palette: Record<string, string>, key: string): string {
  const value = palette[key];
  const alias = /^var\((--[\w-]+)\)$/.exec(value);
  return alias ? resolve(palette, alias[1]) : value;
}
function luminance(hex: string): number {
  const rgb = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  return rgb
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
}
function contrast(a: string, b: string): number {
  const [low, high] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (high + 0.05) / (low + 0.05);
}
it.each([
  ["light", light],
  ["dark", dark],
] as const)("keeps %s normal text and action labels at AA contrast", (_mode, palette) => {
  for (const foreground of ["--fg", "--muted", "--primary-ink"]) {
    for (const background of [
      "--bg",
      "--card",
      ...(foreground === "--muted" ? [] : ["--primary-soft"]),
    ]) {
      expect(
        contrast(resolve(palette, foreground), resolve(palette, background)),
      ).toBeGreaterThanOrEqual(4.5);
    }
  }
  expect(
    contrast(resolve(palette, "--secondary-muted"), resolve(palette, "--primary-soft")),
  ).toBeGreaterThanOrEqual(4.5);
  expect(
    contrast(resolve(palette, "--add-fg"), resolve(palette, "--primary")),
  ).toBeGreaterThanOrEqual(4.5);
  for (const fill of ["--cta", "--cta-hover", "--cta-active"]) {
    expect(contrast(resolve(palette, "--oncta"), resolve(palette, fill))).toBeGreaterThanOrEqual(
      4.5,
    );
  }
  for (const ink of ["--rail-ink", "--sidebar-muted"]) {
    for (const fill of ["--sidebar", "--rail-soft", "--rail-hover"]) {
      expect(contrast(resolve(palette, ink), resolve(palette, fill))).toBeGreaterThanOrEqual(4.5);
    }
  }
});

it("uses the requested Vibrant light and dark palette roles", () => {
  expect(
    Object.fromEntries(
      [
        "--primary",
        "--primary-soft",
        "--cta",
        "--bg",
        "--card",
        "--fg",
        "--muted",
        "--border",
        "--sidebar",
        "--oncta",
      ].map((key) => [key, resolve(light, key)]),
    ),
  ).toEqual({
    "--primary": "#1f2a44",
    "--primary-soft": "#eef2f7",
    "--cta": "#3e5f8a",
    "--bg": "#fafbfc",
    "--card": "#ffffff",
    "--fg": "#252b36",
    "--muted": "#667085",
    "--border": "#e4e8ef",
    "--sidebar": "#1f2a44",
    "--oncta": "#ffffff",
  });
  expect(
    Object.fromEntries(
      [
        "--primary",
        "--primary-soft",
        "--cta",
        "--bg",
        "--card",
        "--fg",
        "--muted",
        "--border",
        "--sidebar",
        "--oncta",
      ].map((key) => [key, resolve(dark, key)]),
    ),
  ).toEqual({
    "--primary": "#a9bcd6",
    "--primary-soft": "#273449",
    "--cta": "#7399c5",
    "--bg": "#111827",
    "--card": "#1b2535",
    "--fg": "#f1f5f9",
    "--muted": "#a6b2c3",
    "--border": "#344154",
    "--sidebar": "#151f30",
    "--oncta": "#111827",
  });
});
