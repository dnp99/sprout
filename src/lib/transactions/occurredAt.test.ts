import { describe, expect, it } from "vitest";
import { occurredAtInputValue } from "./occurredAt";

describe("occurredAtInputValue", () => {
  it("preserves a midnight UTC import's transaction calendar day", () => {
    expect(occurredAtInputValue("2026-07-01T00:00:00.000Z")).toBe("2026-07-01");
  });
});
