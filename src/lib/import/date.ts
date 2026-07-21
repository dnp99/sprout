/** Date parsing for the import pipeline. `parseDate` is lenient (best-effort,
 *  used by the mapping preview); `parseDateStrict` validates the calendar and
 *  rejects impossible or ambiguous dates for the preflight. A preset's format
 *  hint ("YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY") removes slash-date ambiguity;
 *  supported presets never rely on the environment's `Date` parser. */

export type DateResult = { ok: true; iso: string } | { ok: false; reason: string };

/** Lenient: returns an ISO date, or the original string if it can't be parsed. */
export function parseDate(raw: string, format?: string): string {
  const result = parseDateStrict(raw, format);
  if (result.ok) return result.iso;

  // Best-effort fallback for the preview only (never used by the preflight).
  const s = (raw ?? "").trim();
  const parsed = new Date(s);
  if (parsed.getTime() === parsed.getTime()) return parsed.toISOString().slice(0, 10);
  return s;
}

/** Strict: validate the calendar and reject ambiguous slash dates without a
 *  format hint. Does not fall back to `Date.parse`. */
export function parseDateStrict(raw: string, format?: string): DateResult {
  const s = (raw ?? "").trim();
  if (!s) return { ok: false, reason: "empty date" };

  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return build(Number(iso[1]), Number(iso[2]), Number(iso[3]), s);

  const slash = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (slash) {
    const a = Number(slash[1]);
    const b = Number(slash[2]);
    const year = normalizeYear(Number(slash[3]));
    const dayFirst = format === "DD/MM/YYYY" || format === "D/M/YYYY";
    const monthFirst = format === "MM/DD/YYYY" || format === "M/D/YYYY";

    if (!dayFirst && !monthFirst) {
      // No hint: infer only when unambiguous (one value > 12); else reject.
      if (a > 12 && b <= 12) return build(year, b, a, s);
      if (b > 12 && a <= 12) return build(year, a, b, s);
      if (a <= 12 && b <= 12) {
        return { ok: false, reason: `ambiguous date "${s}" — provide a date format` };
      }
      return { ok: false, reason: `invalid date "${s}"` };
    }
    return build(year, dayFirst ? b : a, dayFirst ? a : b, s);
  }

  return { ok: false, reason: `unrecognized date "${s}"` };
}

/** Validate a Y/M/D triple against the real calendar and format as ISO. */
function build(year: number, month: number, day: number, original: string): DateResult {
  if (month < 1 || month > 12) return { ok: false, reason: `invalid month in "${original}"` };
  const maxDay = daysInMonth(year, month);
  if (day < 1 || day > maxDay) return { ok: false, reason: `invalid day in "${original}"` };
  const pad = (n: number) => String(n).padStart(2, "0");
  return { ok: true, iso: `${year}-${pad(month)}-${pad(day)}` };
}

function daysInMonth(year: number, month: number): number {
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const lengths = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return lengths[month - 1];
}

function normalizeYear(y: number): number {
  if (y >= 1000) return y;
  return y >= 70 ? 1900 + y : 2000 + y;
}
