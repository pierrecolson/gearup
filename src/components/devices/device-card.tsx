"use client";

import Link from "next/link";
import { BrandLogo } from "./brand-logo";
import { CategoryChip } from "./category-chip";
import { WarrantyBadge } from "./warranty-badge";
import { PricePrimary } from "./price-display";
import { useFormatShortDate } from "@/components/date-format-provider";
import type { Device } from "@/lib/types";

export function DeviceCard({ device }: { device: Device }) {
  const formatShort = useFormatShortDate();
  return (
    <Link
      href={`?d=${device.id}`}
      scroll={false}
      className="group block rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <BrandLogo brand={device.brand} size={36} />
          <div className="min-w-0">
            <div className="font-medium text-sm leading-tight truncate group-hover:underline underline-offset-4">
              {device.name}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {device.brand}
            </div>
          </div>
        </div>
        <PricePrimary device={device} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <CategoryChip category={device.category} />
          {device.context === "professional" && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-foreground/5 text-muted-foreground">
              Work
            </span>
          )}
        </div>
        <WarrantyBadge device={device} />
      </div>
      {device.purchaseDate && (
        <div className="mt-3 text-xs text-muted-foreground">
          Purchased {formatShort(device.purchaseDate)}
          {device.purchaseLocation ? ` · ${device.purchaseLocation}` : ""}
        </div>
      )}
    </Link>
  );
}
