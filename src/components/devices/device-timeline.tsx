"use client";

import {
  addMonths,
  format,
  formatDistanceToNowStrict,
  isAfter,
  isBefore,
  isSameDay,
} from "date-fns";
import {
  ShoppingBagOpen,
  ShieldCheck,
  ArrowsClockwise,
  Sparkle,
  Circle,
} from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/utils";
import type { Device } from "@/lib/types";

type Tone = "purchase" | "warranty" | "today" | "renewal" | "version";

type Milestone = {
  date: Date;
  label: string;
  tone: Tone;
};

const ICONS: Record<Tone, React.ElementType> = {
  purchase: ShoppingBagOpen,
  warranty: ShieldCheck,
  today: Circle,
  renewal: ArrowsClockwise,
  version: Sparkle,
};

const ACCENT: Record<Tone, string> = {
  purchase: "bg-foreground text-background",
  warranty: "bg-amber-500 text-white",
  today: "bg-blue-500 text-white ring-4 ring-blue-500/20",
  renewal: "bg-violet-500 text-white",
  version: "bg-emerald-500 text-white",
};

export function DeviceTimeline({
  device,
  versionReleases = [],
}: {
  device: Device;
  versionReleases?: Array<{ name: string; releasedOn: string | null }>;
}) {
  if (!device.purchaseDate) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground text-center">
        Add a purchase date to see the lifecycle timeline.
      </div>
    );
  }

  const today = new Date();
  const purchase = new Date(device.purchaseDate);
  const milestones: Milestone[] = [
    { date: purchase, label: "Purchased", tone: "purchase" },
  ];

  if (device.warrantyMonths !== null && device.warrantyMonths !== undefined) {
    const end = addMonths(purchase, device.warrantyMonths);
    milestones.push({
      date: end,
      label: isBefore(end, today) ? "Warranty ended" : "Warranty ends",
      tone: "warranty",
    });
  }
  if (device.expectedRenewalDate) {
    milestones.push({
      date: new Date(device.expectedRenewalDate),
      label: "Expected renewal",
      tone: "renewal",
    });
  }
  for (const v of versionReleases) {
    if (!v.releasedOn) continue;
    const d = new Date(v.releasedOn);
    if (Number.isNaN(d.getTime())) continue;
    if (isBefore(d, purchase)) continue;
    milestones.push({ date: d, label: v.name, tone: "version" });
  }
  milestones.push({ date: today, label: "Today", tone: "today" });
  milestones.sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <section>
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">
        Lifecycle
      </h3>
      <ol className="relative">
        {/* connecting rail */}
        <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border" />
        {milestones.map((m, i) => (
          <MilestoneRow key={`${m.tone}-${i}`} milestone={m} today={today} />
        ))}
      </ol>
    </section>
  );
}

function MilestoneRow({
  milestone,
  today,
}: {
  milestone: Milestone;
  today: Date;
}) {
  const Icon = ICONS[milestone.tone];
  const isToday = milestone.tone === "today";
  const isPast = isBefore(milestone.date, today) && !isSameDay(milestone.date, today);
  const isFuture = isAfter(milestone.date, today) && !isSameDay(milestone.date, today);
  const relative = isToday
    ? "Now"
    : isPast
    ? `${formatDistanceToNowStrict(milestone.date)} ago`
    : `in ${formatDistanceToNowStrict(milestone.date)}`;

  return (
    <li className="relative flex gap-4 pb-5 last:pb-0">
      <span
        className={cn(
          "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full shadow-sm",
          isFuture && !isToday
            ? "bg-card border border-border text-muted-foreground"
            : ACCENT[milestone.tone],
        )}
      >
        <Icon weight={isFuture ? "regular" : "fill"} className="size-4" />
      </span>
      <div className="flex-1 min-w-0 pt-1">
        <div
          className={cn(
            "text-sm font-medium",
            isToday ? "text-blue-600 dark:text-blue-400" : "text-foreground",
            isFuture && !isToday && "text-muted-foreground",
          )}
        >
          {milestone.label}
        </div>
        <div className="text-xs text-muted-foreground tabular-nums mt-0.5 flex items-center gap-1.5">
          <span>{format(milestone.date, "MMM d, yyyy")}</span>
          <span className="text-border">·</span>
          <span>{relative}</span>
        </div>
      </div>
    </li>
  );
}
