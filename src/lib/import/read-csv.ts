/** Minimal, correct delimited-text reader — handles quoted fields, embedded
 *  delimiters / newlines, and escaped quotes (""). Detects comma (CSV) vs tab
 *  (TSV) and strips a UTF-8 BOM, so exports that vary by locale (e.g. YNAB) read
 *  correctly. No dependency, so it runs in the script and the browser alike. */

export type Delimiter = "," | "\t";

/** Strip a leading UTF-8 byte-order mark if present. */
export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** Detect the field delimiter from the header line: whichever of comma / tab
 *  occurs more often outside quotes wins; ties fall back to comma. */
export function detectDelimiter(text: string): Delimiter {
  const firstLine = stripBom(text).replace(/\r\n?/g, "\n").split("\n", 1)[0] ?? "";
  let commas = 0;
  let tabs = 0;
  let inQuotes = false;
  for (let i = 0; i < firstLine.length; i++) {
    const ch = firstLine[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes && ch === ",") commas++;
    else if (!inQuotes && ch === "\t") tabs++;
  }
  return tabs > commas ? "\t" : ",";
}

/** Parse delimited text into a grid of string cells, honoring RFC-4180 quoting. */
export function parseDelimited(text: string, delimiter: Delimiter): string[][] {
  const rows: string[][] = [];
  const normalized = stripBom(text).replace(/\r\n?/g, "\n");
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop fully-empty lines.
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

/** Parse a file into a grid, auto-detecting comma vs tab and stripping a BOM. */
export function parseCsv(text: string): string[][] {
  return parseDelimited(text, detectDelimiter(text));
}

/** Normalize a header for case/whitespace-insensitive matching (detection and
 *  preset column lookup by intent). The original headers are preserved as record
 *  keys for display and exact access. */
export function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Turn parsed rows into header-keyed records (first row = headers). Keys are the
 *  original (trimmed) headers so mapping-by-column-name and display stay exact. */
export function toRecords(rows: string[][]): Record<string, string>[] {
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? "").trim()])));
}

/** Convenience: delimited text -> records. */
export function readCsv(text: string): Record<string, string>[] {
  return toRecords(parseCsv(text));
}
