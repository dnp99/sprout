import { describe, expect, it } from "vitest";
import { goalTargetLabel } from "./dto";

describe("goalTargetLabel", () => {
  it("reports reached at 100%+", () => {
    expect(goalTargetLabel(1000, 1000, null)).toBe("Reached!");
    expect(goalTargetLabel(1200, 1000, "2026-12-01")).toBe("Reached!");
  });

  it("reports almost there from 80%", () => {
    expect(goalTargetLabel(840000, 1000000, "2026-12-01")).toBe("Almost there!");
  });

  it("falls back to the target month when below 80%", () => {
    expect(goalTargetLabel(210000, 500000, "2026-12-01")).toBe("Dec 2026");
  });

  it("is empty with no date and low progress", () => {
    expect(goalTargetLabel(100, 1000, null)).toBe("");
  });
});
