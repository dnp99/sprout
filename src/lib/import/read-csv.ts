/** Minimal, correct CSV reader — handles quoted fields, embedded commas /
 *  newlines, and escaped quotes (""). No dependency so it runs in the script and
 *  (later) the browser upload path alike. */

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  const normalized = text.replace(/\r\n?/g, "\n");
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
    } else if (ch === ",") {
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

/** Turn parsed rows into header-keyed records (first row = headers). */
export function toRecords(rows: string[][]): Record<string, string>[] {
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? "").trim()])));
}

/** Convenience: CSV text -> records. */
export function readCsv(text: string): Record<string, string>[] {
  return toRecords(parseCsv(text));
}
