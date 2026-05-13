import Link from "next/link";
import { format } from "date-fns";
import { BrandLogo } from "./brand-logo";
import { CategoryChip } from "./category-chip";
import { WarrantyBadge } from "./warranty-badge";
import { formatMoney } from "@/lib/currency-format";
import type { Device } from "@/lib/types";

export function DeviceRowHeader() {
  return (
    <div className="hidden md:grid grid-cols-[1fr_120px_110px_110px_100px] gap-3 px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
      <div>Device</div>
      <div>Category</div>
      <div>Purchased</div>
      <div className="text-right">Price</div>
      <div className="text-right">Warranty</div>
    </div>
  );
}

export function DeviceRow({ device }: { device: Device }) {
  return (
    <Link
      href={`?d=${device.id}`}
      scroll={false}
      className="grid grid-cols-1 md:grid-cols-[1fr_120px_110px_110px_100px] gap-3 items-center px-4 py-3 hover:bg-accent/40 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <BrandLogo brand={device.brand} size={28} />
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{device.name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {device.brand}
          </div>
        </div>
      </div>
      <div>
        <CategoryChip category={device.category} />
      </div>
      <div className="text-sm text-muted-foreground tabular-nums">
        {device.purchaseDate ? format(new Date(device.purchaseDate), "MMM yyyy") : "—"}
      </div>
      <div className="text-sm tabular-nums text-right">
        {device.pricePaidBaseSnapshot !== null && device.baseCurrencyAtSnapshot
          ? formatMoney(device.pricePaidBaseSnapshot, device.baseCurrencyAtSnapshot)
          : device.pricePaid !== null
          ? formatMoney(device.pricePaid, device.currency)
          : "—"}
      </div>
      <div className="flex justify-end">
        <WarrantyBadge device={device} />
      </div>
    </Link>
  );
}
