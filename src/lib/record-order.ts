/** Reporting day stays primary; creation time orders records within that day.
 * Editing a record does not change createdAt and therefore cannot bump it up. */
export function compareRecordOrder(
  a: { id: string; date: string; createdAt?: string },
  b: { id: string; date: string; createdAt?: string },
): number {
  return (
    b.date.slice(0, 10).localeCompare(a.date.slice(0, 10)) ||
    (b.createdAt ?? b.date).localeCompare(a.createdAt ?? a.date) ||
    b.id.localeCompare(a.id)
  );
}
