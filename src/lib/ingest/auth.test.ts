import { describe, expect, it } from "vitest";
import { hashToken, parseBearer } from "./auth";

describe("hashToken", () => {
  it("is a stable 64-char sha256 hex and never returns the raw token", () => {
    const h = hashToken("sprt_abc123");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).toBe(hashToken("sprt_abc123")); // deterministic
    expect(h).not.toContain("sprt_abc123");
  });

  it("differs for different tokens", () => {
    expect(hashToken("a")).not.toBe(hashToken("b"));
  });
});

describe("parseBearer", () => {
  it("extracts the token from a Bearer header (case-insensitive)", () => {
    expect(parseBearer("Bearer sprt_xyz")).toBe("sprt_xyz");
    expect(parseBearer("bearer  sprt_xyz  ")).toBe("sprt_xyz");
  });

  it("returns null for missing or non-Bearer headers", () => {
    expect(parseBearer(null)).toBeNull();
    expect(parseBearer(undefined)).toBeNull();
    expect(parseBearer("Basic abc")).toBeNull();
    expect(parseBearer("sprt_xyz")).toBeNull();
  });
});
