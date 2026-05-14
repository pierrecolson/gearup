"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowSquareOut, CircleNotch } from "@phosphor-icons/react/ssr";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { BrandLogo } from "./brand-logo";
import { CategoryChip } from "./category-chip";
import { WarrantyBadge } from "./warranty-badge";
import { DeviceTimeline } from "./device-timeline";
import { DeviceActionsMenu } from "./device-actions-menu";
import { VersionEditor, type VersionEntry } from "./version-editor";
import { formatMoney } from "@/lib/currency-format";
import {
  useFormatDate,
  useFormatShortDate,
} from "@/components/date-format-provider";
import type { Device, Group } from "@/lib/types";

type DetailPayload = {
  device: Device;
  group: Group | null;
  siblings: Device[];
  livePrice: number | null;
  displayCurrency: string;
};

function useDeviceDetail(id: string | null) {
  const [data, setData] = useState<DetailPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!id) {
      setData(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    fetch(`/api/devices/${id}/detail`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Not found");
        return (await res.json()) as DetailPayload;
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { data, loading, error };
}

export function DevicePanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const id = searchParams.get("d");
  const { data, loading, error } = useDeviceDetail(id);

  function close(openState: boolean) {
    if (openState) return;
    // Strip `d` and `edit` params, preserve others.
    const params = new URLSearchParams(searchParams.toString());
    params.delete("d");
    params.delete("edit");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <Sheet open={!!id} onOpenChange={close}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 overflow-y-auto"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{data?.device.name ?? "Device"}</SheetTitle>
          <SheetDescription>Device detail</SheetDescription>
        </SheetHeader>
        {loading && (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <CircleNotch className="size-5 animate-spin" />
          </div>
        )}
        {error && (
          <div className="p-8 text-sm text-muted-foreground">
            Couldn&apos;t load this device. It may have been deleted.
          </div>
        )}
        {data && <DevicePanelContent payload={data} />}
      </SheetContent>
    </Sheet>
  );
}

function DevicePanelContent({ payload }: { payload: DetailPayload }) {
  const { device, group, siblings, livePrice, displayCurrency } = payload;
  const [versionReleases, setVersionReleases] = useState<VersionEntry[]>([]);
  const formatDate = useFormatDate();
  const formatShort = useFormatShortDate();
  return (
    <div className="px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <BrandLogo brand={device.brand} size={44} />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight truncate">
              {device.name}
            </h2>
            <div className="text-sm text-muted-foreground truncate">
              {device.brand}
            </div>
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <CategoryChip category={device.category} />
              {device.context === "professional" && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-foreground/5 text-muted-foreground">
                  Work
                </span>
              )}
              {device.status !== "owned" && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground capitalize">
                  {device.status}
                </span>
              )}
              <WarrantyBadge device={device} />
            </div>
          </div>
        </div>
        <div className="shrink-0 mr-8">
          {/* `mr-8` reserves room for the Sheet's built-in close X in the corner */}
          <DeviceActionsMenu deviceId={device.id} deviceName={device.name} />
        </div>
      </div>

      {/* Price */}
      {device.pricePaid !== null && (
        <>
          <Separator />
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
              Value
            </h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <ValueCell
                label="Paid"
                value={formatMoney(device.pricePaid, device.currency)}
                sub={device.currency}
              />
              {device.pricePaidBaseSnapshot !== null &&
                device.baseCurrencyAtSnapshot && (
                  <ValueCell
                    label="At purchase"
                    value={formatMoney(
                      device.pricePaidBaseSnapshot,
                      device.baseCurrencyAtSnapshot,
                    )}
                    sub={formatShort(device.purchaseDate)}
                  />
                )}
              {livePrice !== null && (
                <ValueCell
                  label="Today"
                  value={formatMoney(livePrice, displayCurrency)}
                  sub={delta(device.pricePaidBaseSnapshot, livePrice)}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* Info */}
      <Separator />
      <div className="space-y-2.5 text-sm">
        <Row label="Purchased">{formatDate(device.purchaseDate)}</Row>
        <Row label="Where">{device.purchaseLocation ?? "—"}</Row>
        <Row label="Condition">
          <span className="capitalize">{device.condition ?? "—"}</span>
        </Row>
        <Row label="Warranty">
          {device.warrantyMonths ? `${device.warrantyMonths} months` : "—"}
        </Row>
        <Row label="Renewal target">
          {formatShort(device.expectedRenewalDate)}
        </Row>
        <Row label="Receipt #">{device.receiptNumber ?? "—"}</Row>
        <Row label="Serial #">
          <span className="font-mono text-xs">
            {device.serialNumber ?? "—"}
          </span>
        </Row>
        {device.receiptFile && (
          <Row label="Receipt file">
            <Link
              href={`/api/receipts/${device.receiptFile}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
            >
              View receipt
              <ArrowSquareOut className="size-3" />
            </Link>
          </Row>
        )}
        {group && (
          <Row label="Group">
            <Link
              href={`/groups/${group.id}`}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {group.name}
            </Link>
          </Row>
        )}
      </div>

      {/* Notes */}
      {device.notes && (
        <>
          <Separator />
          <div>
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
              Notes
            </h3>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {device.notes}
            </p>
          </div>
        </>
      )}

      {/* Timeline */}
      {device.purchaseDate && (
        <>
          <Separator />
          <DeviceTimeline device={device} versionReleases={versionReleases} />
        </>
      )}

      {/* Version tracking editor */}
      {device.trackVersions && device.modelFamily && (
        <>
          <Separator />
          <VersionEditor
            family={device.modelFamily}
            purchaseDate={device.purchaseDate}
            onChange={setVersionReleases}
          />
        </>
      )}

      {/* Group siblings */}
      {siblings.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
              Group siblings
            </h3>
            <div className="divide-y divide-border/60 rounded-lg border border-border/60">
              {siblings.map((s) => (
                <Link
                  key={s.id}
                  href={`?d=${s.id}`}
                  scroll={false}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/40"
                >
                  <BrandLogo brand={s.brand} size={24} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {s.brand}
                    </div>
                  </div>
                  <CategoryChip category={s.category} />
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

function ValueCell({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-medium tabular-nums">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function delta(from: number | null, to: number | null): string {
  if (from === null || to === null || from === 0) return "live rate";
  const pct = ((to - from) / from) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}% vs purchase`;
}
