export function formatPrice(price: string | number, currency = "USD"): string {
  const amount = typeof price === "string" ? Number.parseFloat(price) : price;
  if (Number.isNaN(amount)) return String(price);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}
