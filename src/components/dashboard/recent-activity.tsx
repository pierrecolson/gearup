import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { BrandLogo } from "@/components/devices/brand-logo";
import { CategoryChip } from "@/components/devices/category-chip";
import type { Device } from "@/lib/types";

export function RecentActivity({ devices }: { devices: Device[] }) {
  if (devices.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
        No devices yet.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/60">
      {devices.map((d) => (
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
              <div className="text-xs text-muted-foreground">
                Added {formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}
              </div>
            </div>
          </div>
          <CategoryChip category={d.category} />
        </Link>
      ))}
    </div>
  );
}
