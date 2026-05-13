/**
 * Client-safe currency helpers. No Node APIs allowed in this file — it's
 * imported by client components. The server-only FX-rate fetcher and snapshot
 * helpers live in `./currency.ts` (which is server-only).
 */

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: zeroDecimal(currency) ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(zeroDecimal(currency) ? 0 : 2)} ${currency}`;
  }
}

function zeroDecimal(currency: string): boolean {
  return ["JPY", "KRW", "VND", "CLP", "ISK", "TWD", "HUF"].includes(currency);
}

// ISO 4217 currencies we let the user pick from. Not exhaustive — covers the
// common ones; the form accepts any 3-letter code so power users aren't blocked.
export const COMMON_CURRENCIES = [
  "KRW",
  "EUR",
  "USD",
  "GBP",
  "JPY",
  "CNY",
  "CHF",
  "CAD",
  "AUD",
  "HKD",
  "SGD",
  "SEK",
  "NOK",
  "DKK",
  "PLN",
  "CZK",
] as const;
