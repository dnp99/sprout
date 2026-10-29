import { afterEach, expect, it, vi } from "vitest";
import { persistEditedHighlight, readEditedHighlight } from "./edited-highlight";
afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
it("defaults on and restores an explicit opt-out", () => {
  expect(readEditedHighlight()).toBe(true);
  persistEditedHighlight(false);
  expect(readEditedHighlight()).toBe(false);
  persistEditedHighlight(true);
  expect(readEditedHighlight()).toBe(true);
});
it("keeps the default usable when browser storage is unavailable", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  expect(readEditedHighlight()).toBe(true);
});
