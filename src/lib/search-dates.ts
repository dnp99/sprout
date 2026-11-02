/** Inclusive calendar-month bounds avoid timezone shifts and keep day 31 out
 * of shorter months. Search uses date strings, never local midnight instants. */
export function monthSearchBounds(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw Error("Invalid search month");
  const [year, number] = month.split("-").map(Number);
  const days = new Date(Date.UTC(year, number, 0)).getUTCDate();
  return { from: `${month}-01`, to: `${month}-${days}` };
}
