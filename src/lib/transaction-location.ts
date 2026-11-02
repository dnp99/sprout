/** Business/category links survive refresh and browser history without sharing another user's data. */
export function transactionLocation(category: string, business: string, period: string) {
  const query = new URLSearchParams();
  if (category && category !== "all") query.set("cat", category);
  if (business && business !== "all") {
    query.set("business", business);
    if (period === "all") query.set("scope", "all");
  }
  return "/transactions" + (query.size ? `?${query}` : "");
}
