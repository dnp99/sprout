/** Parse a source date string into an ISO date (YYYY-MM-DD). Handles ISO,
 *  MM/DD/YYYY and DD/MM/YYYY (via a format hint), with a Date.parse fallback. */
export function parseDate(raw: string, format?: string): string {
  const s = (raw ?? "").trim();
  if (!s) return "";

  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return isoDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const slash = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (slash) {
    const a = Number(slash[1]);
    const b = Number(slash[2]);
    const year = normalizeYear(Number(slash[3]));
    const dayFirst = format === "DD/MM/YYYY" || format === "D/M/YYYY";
    const month = dayFirst ? b : a;
    const day = dayFirst ? a : b;
    return isoDate(year, month, day);
  }

  const parsed = new Date(s);
  if (parsed.getTime() === parsed.getTime()) return parsed.toISOString().slice(0, 10);
  return s;
}

function normalizeYear(y: number): number {
  if (y >= 1000) return y;
  return y >= 70 ? 1900 + y : 2000 + y;
}

function isoDate(year: number, month: number, day: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}
