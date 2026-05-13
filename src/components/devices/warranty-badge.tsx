import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldWarning, ShieldSlash } from "@phosphor-icons/react/ssr";
import { warrantyDaysLeft, warrantyStatus } from "@/lib/selectors";
import type { Device } from "@/lib/types";

const TONE: Record<string, string> = {
  active:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "expiring-soon": "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  expired: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  none: "bg-muted text-muted-foreground",
};

export function WarrantyBadge({
  device,
  className,
}: {
  device: Device;
  className?: string;
}) {
  const status = warrantyStatus(device);
  const daysLeft = warrantyDaysLeft(device);
  const Icon =
    status === "active"
      ? ShieldCheck
      : status === "expired"
      ? ShieldSlash
      : ShieldWarning;

  let label = "No warranty";
  if (status === "active" && daysLeft !== null) {
    label = daysLeft > 365
      ? `${Math.round(daysLeft / 365 * 10) / 10}y left`
      : `${daysLeft}d left`;
  } else if (status === "expiring-soon" && daysLeft !== null) {
    label = `${daysLeft}d left`;
  } else if (status === "expired") {
    label = "Expired";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        TONE[status],
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}
