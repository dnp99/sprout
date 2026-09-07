/** The fill-in CSV template downloaded from Import. Amounts are signed dollars:
 * positive for income, negative for expenses. Keep the single example row so
 * spreadsheet apps preserve the header/order and users can overwrite it. */
export const SPROUT_TEMPLATE_CSV = [
  "Date,Description,Amount,Source,Transaction Type,Category",
  "2026-01-15,Coffee shop,-4.50,Chequing,Expense,Dining out",
].join("\n");

export const SPROUT_TEMPLATE_FILENAME = "sprout-import-template.csv";
