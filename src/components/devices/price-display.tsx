import { formatMoney } from "@/lib/currency-format";
import type { Device } from "@/lib/types";

/**
 * Compact price block for cards: prominent at-purchase (frozen) figure with
 * original-currency subtitle. If snapshot is missing we show the original
 * price and a small "pending" hint.
 */
export function PricePrimary({ device }: { device: Device }) {
  if (device.pricePaid === null) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }
  const showSnapshot =
    device.pricePaidBaseSnapshot !== null &&
    device.baseCurrencyAtSnapshot !== null &&
    device.baseCurrencyAtSnapshot !== device.currency;
  return (
    <div className="flex flex-col items-end leading-tight">
      <span className="font-medium tabular-nums">
        {showSnapshot && device.pricePaidBaseSnapshot !== null
          ? formatMoney(device.pricePaidBaseSnapshot, device.baseCurrencyAtSnapshot ?? "EUR")
          : formatMoney(device.pricePaid, device.currency)}
      </span>
      {showSnapshot && (
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {formatMoney(device.pricePaid, device.currency)}
        </span>
      )}
      {device.pricePaid !== null && device.pricePaidBaseSnapshot === null && (
        <span className="text-[10px] text-amber-600 dark:text-amber-400">
          FX pending
        </span>
      )}
    </div>
  );
}
