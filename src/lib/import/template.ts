/** The fill-in CSV template downloaded from Import. Each supported transaction
 * type has one valid example, so people can copy the row that matches their
 * spreadsheet instead of having to infer type and amount-sign combinations. */
export const SPROUT_TEMPLATE_CSV = [
  "Date,Description,Amount,Source,Transaction Type,Category",
  "2026-01-15,Coffee shop,-4.50,Chequing,Expense,Dining out",
  "2026-01-16,Paycheque,3200.00,Chequing,Income,Salary",
  "2026-01-17,Friend repayment,24.50,Chequing,Reimbursement,Dining out",
  "2026-01-18,Move to savings,-500.00,Chequing,Transfer,Transfer",
  "2026-01-19,Credit card payment,-750.00,Chequing,Payment,Transfer",
].join("\n");

export const SPROUT_TEMPLATE_FILENAME = "sprout-import-template.csv";
