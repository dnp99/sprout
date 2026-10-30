import { expect, it } from "vitest";
import { requiresDeleteConfirmation } from "./deletion";
it("applies the same deletion boundary to individual and bulk actions", () => {
  for (const count of [0, 1, 5]) expect(requiresDeleteConfirmation(count)).toBe(false);
  for (const count of [6, 100]) expect(requiresDeleteConfirmation(count)).toBe(true);
});
