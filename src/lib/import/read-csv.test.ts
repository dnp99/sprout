import { describe, expect, it } from "vitest";
import { readCsv } from "./read-csv";

describe("readCsv", () => {
  it("parses quoted fields with commas and escaped quotes", () => {
    const csv =
      'Date,Merchant,Amount\n2026-06-01,"Amazon, Inc.",-27.74\n2026-06-02,"Say ""hi""",5.00';
    const records = readCsv(csv);
    expect(records).toHaveLength(2);
    expect(records[0].Merchant).toBe("Amazon, Inc.");
    expect(records[0].Amount).toBe("-27.74");
    expect(records[1].Merchant).toBe('Say "hi"');
  });

  it("handles CRLF line endings and a trailing newline", () => {
    expect(readCsv("A,B\r\n1,2\r\n")).toEqual([{ A: "1", B: "2" }]);
  });

  it("drops spreadsheet padding rows that contain only empty columns", () => {
    expect(readCsv("Date,Merchant,Amount\n2026-01-01,Tea,-5\n,,,\n, , ")).toEqual([
      { Date: "2026-01-01", Merchant: "Tea", Amount: "-5" },
    ]);
  });

  it("supports a newline inside a quoted field", () => {
    const records = readCsv('Note,Amt\n"line1\nline2",5');
    expect(records[0].Note).toBe("line1\nline2");
  });
});
