import { describe, expect, it } from "vitest";
import { resolveUserCategoryId } from "./category-map";

describe("resolveUserCategoryId", () => {
  const categories = new Map([
    ["taxi", "taxi-id"],
    ["insurance/tax", "insurance-tax-id"],
  ]);

  it("honours a user's explicit source category regardless of casing or whitespace", () => {
    expect(resolveUserCategoryId(" Taxi ", categories)).toBe("taxi-id");
  });

  it("leaves unknown source labels for preset or merchant-rule resolution", () => {
    expect(resolveUserCategoryId("Rideshare", categories)).toBeNull();
  });
});
