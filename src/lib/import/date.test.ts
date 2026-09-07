import { describe, expect, it } from "vitest";
import { parseDate, parseDateStrict } from "./date";

describe("parseDateStrict", () => {
  it("parses ISO dates", () => {
    expect(parseDateStrict("2026-06-01")).toEqual({ ok: true, iso: "2026-06-01" });
    expect(parseDateStrict("2026-6-1")).toEqual({ ok: true, iso: "2026-06-01" });
  });

  it("honors a format hint for slash dates", () => {
    expect(parseDateStrict("06/01/2026", "MM/DD/YYYY")).toEqual({ ok: true, iso: "2026-06-01" });
    expect(parseDateStrict("06/01/2026", "DD/MM/YYYY")).toEqual({ ok: true, iso: "2026-01-06" });
  });

  it("parses unambiguous spreadsheet day-month-name dates", () => {
    expect(parseDateStrict("1-Jan-26", "D-MMM-YY")).toEqual({ ok: true, iso: "2026-01-01" });
    expect(parseDateStrict("29-Feb-24", "D-MMM-YY")).toEqual({ ok: true, iso: "2024-02-29" });
    expect(parseDateStrict("29-Feb-25", "D-MMM-YY").ok).toBe(false);
  });

  it("infers only when unambiguous (one component > 12)", () => {
    expect(parseDateStrict("06/15/2026")).toEqual({ ok: true, iso: "2026-06-15" });
    expect(parseDateStrict("15/06/2026")).toEqual({ ok: true, iso: "2026-06-15" });
  });

  it("rejects ambiguous slash dates without a hint", () => {
    const r = parseDateStrict("01/02/2026");
    expect(r.ok).toBe(false);
  });

  it("rejects impossible calendar dates", () => {
    expect(parseDateStrict("2026-13-01").ok).toBe(false);
    expect(parseDateStrict("2026-02-30").ok).toBe(false);
    expect(parseDateStrict("2025-02-29").ok).toBe(false); // not a leap year
    expect(parseDateStrict("2024-02-29").ok).toBe(true); // leap year
  });

  it("rejects empty / unrecognized input", () => {
    expect(parseDateStrict("").ok).toBe(false);
    expect(parseDateStrict("June 1st").ok).toBe(false);
  });
});

describe("parseDate (lenient)", () => {
  it("returns ISO for valid dates", () => {
    expect(parseDate("2026-06-01")).toBe("2026-06-01");
    expect(parseDate("06/15/2026")).toBe("2026-06-15");
  });
});
