import Link from "next/link";
import { BrandLogo } from "@/components/devices/brand-logo";
import { warrantyDaysLeft, warrantyStatus } from "@/lib/selectors";
import type { Device } from "@/lib/types";

export function WarrantyFeed({ devices }: { devices: Device[] }) {
  if (devices.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
        Nothing expiring in the next 90 days. Nice.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/60">
      {devices.map((d) => {
        const days = warrantyDaysLeft(d);
        const status = warrantyStatus(d);
        return (
          <Link
            key={d.id}
            href={`?d=${d.id}`}
            scroll={false}
            className="flex items-center justify-between gap-3 p-4 hover:bg-accent/40 transition-colors first:rounded-t-xl last:rounded-b-xl"
          >
            <div className="flex items-center gap-3 min-w-0">
              <BrandLogo brand={d.brand} size={28} />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{d.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {d.brand}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-sm font-medium tabular-nums ${status === "expiring-soon" ? "text-amber-600 dark:text-amber-400" : ""}`}
              >
                {days} days
              </div>
              <div className="text-xs text-muted-foreground">left</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
