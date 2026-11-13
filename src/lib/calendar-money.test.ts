import { expect, it } from "vitest";
import { formatMoney, formatMoneySegments } from "./format";
it("exposes locale-preserving currency break opportunities without changing exact output", () => {
  expect(formatMoneySegments(-123456, { locale: "en-CA" })).toMatchObject({
    text: "−$1,234.56",
    before: "−$",
    value: "1,234.56",
    after: "",
  });
  const fr = formatMoneySegments(-123456, { locale: "fr-CA" });
  expect(fr.text).toBe(formatMoney(-123456, { locale: "fr-CA" }));
  expect(fr.before).toBe("");
  expect(fr.value.startsWith("−")).toBe(true);
  expect(fr.after).toBe("$");
});
it("keeps compact rounding opt-in while exact labels retain cents", () => {
  expect(formatMoney(12345)).toBe("$123.45");
  expect(formatMoneySegments(12345, { compact: true, compactSignificantDigits: 2 }).value).toBe(
    "120",
  );
  expect(formatMoneySegments(123456, { compact: true }).abbreviated).toBe(true);
});
it("exposes localized compact units as safe line-break boundaries", () => {
  const zh = formatMoneySegments(99999999, {
    locale: "zh-Hans",
    compact: true,
    compactSignificantDigits: 1,
  });
  expect(zh.unit).toBe("万");
  expect(zh.value).toBe("100万");
});
