import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  appearanceScript,
  applyTheme,
  applyVisualTheme,
  parseVisualTheme,
  persistPref,
  persistVisualTheme,
  readPref,
  readVisualTheme,
  resolveTheme,
} from "./index";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
  delete document.documentElement.dataset.visualTheme;
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: true })),
  );
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("independent palette and color mode preferences", () => {
  it("defaults safely and keeps old color-mode preferences working", () => {
    expect(parseVisualTheme("unknown")).toBe("vibrant");
    expect(readVisualTheme()).toBe("vibrant");
    localStorage.setItem("sprout-theme", "light");
    expect(readPref()).toBe("light");
    expect(resolveTheme("system")).toBe("dark");
    expect(resolveTheme(readPref())).toBe("light");
  });

  it("changing a palette preserves the mode and changing mode preserves the palette", () => {
    persistPref("dark");
    applyTheme("dark");
    persistVisualTheme("cozy");
    applyVisualTheme("cozy");
    expect(readPref()).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    persistPref("system");
    applyTheme("light");
    expect(readVisualTheme()).toBe("cozy");
    expect(document.documentElement.dataset.visualTheme).toBe("cozy");
    expect(localStorage.getItem("sprout-theme")).toBeNull();
    persistVisualTheme("vibrant");
    expect(localStorage.getItem("sprout-visual-theme")).toBeNull();
  });

  it.each(["light", "dark", "system"] as const)(
    "bootstrap matches hydration for Cozy in %s mode",
    (pref) => {
      persistPref(pref);
      persistVisualTheme("cozy");
      window.eval(appearanceScript);
      expect(document.documentElement.dataset.visualTheme).toBe(readVisualTheme());
      expect(document.documentElement.classList.contains("dark")).toBe(
        resolveTheme(pref) === "dark",
      );
    },
  );

  it("still follows the device when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw Error("blocked");
    });
    expect(() => persistVisualTheme("cozy")).not.toThrow();
    expect(readVisualTheme()).toBe("vibrant");
    window.eval(appearanceScript);
    expect(document.documentElement.dataset.visualTheme).toBe("vibrant");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
