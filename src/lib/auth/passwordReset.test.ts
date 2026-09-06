import { describe, expect, it } from "vitest";
import {
  PASSWORD_RESET_TTL_MS,
  createResetToken,
  hashResetValue,
  normalizeEmail,
  resetExpiry,
} from "./passwordReset";

describe("password reset helpers", () => {
  it("normalizes valid emails and rejects malformed values", () => {
    expect(normalizeEmail("  Sam@Example.COM ")).toBe("sam@example.com");
    expect(normalizeEmail("not an email")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });

  it("creates unique opaque tokens and hashes instead of persisting their value", () => {
    const token = createResetToken();
    expect(token).toHaveLength(43);
    expect(createResetToken()).not.toBe(token);
    expect(hashResetValue(token)).not.toBe(token);
    expect(hashResetValue(token)).toHaveLength(64);
  });

  it("expires reset links after thirty minutes", () => {
    const from = new Date("2026-09-05T12:00:00.000Z");
    expect(resetExpiry(from).getTime() - from.getTime()).toBe(PASSWORD_RESET_TTL_MS);
  });
});
