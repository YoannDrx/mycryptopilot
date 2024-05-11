export const formatPrice = (price: number | null = 0, currency = "eur") => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  });
  return formatter.format((price ?? 0) / 100);
};
