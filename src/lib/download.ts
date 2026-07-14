/** Trigger a browser download of in-memory text as a file (client-only). Used for
 *  client-generated exports (e.g. the cash-flow CSV) that don't need a server
 *  round-trip, unlike the full transaction export which streams from /api/export. */
export function downloadTextFile(filename: string, text: string, mime = "text/csv"): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
