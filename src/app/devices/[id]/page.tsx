import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Pencil, ArrowSquareOut } from "@phosphor-icons/react/ssr";
import {
  getDevice,
  getGroup,
  listDevices,
  listGroups,
} from "@/lib/store";
import { listResellers } from "@/lib/resellers-store";
import { getSettings } from "@/lib/settings";
import { liveConvert } from "@/lib/currency";
import { formatMoney } from "@/lib/currency-format";
import { ageInYears, warrantyEndsAt } from "@/lib/selectors";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BrandLogo } from "@/components/devices/brand-logo";
import { CategoryChip } from "@/components/devices/category-chip";
import { WarrantyBadge } from "@/components/devices/warranty-badge";
import { DeviceTimeline } from "@/components/devices/device-timeline";
import { DeleteDeviceButton } from "@/components/devices/delete-device-button";
import { DeviceForm } from "@/components/devices/device-form";

type Ctx = { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string }> };

export default async function DeviceDetailPage({ params, searchParams }: Ctx) {
  const { id } = await params;
  const { edit } = await searchParams;
  const device = await getDevice(id);
  if (!device) notFound();

  const [settings, allDevices, allGroups, resellers] = await Promise.all([
    getSettings(),
    listDevices(),
    listGroups(),
    listResellers(),
  ]);

  const group = device.groupId ? await getGroup(device.groupId) : null;
  const siblings = device.groupId
    ? allDevices.filter((d) => d.groupId === device.groupId && d.id !== device.id)
    : [];

  const livePrice =
    device.pricePaid !== null
      ? await liveConvert(
          device.pricePaid,
          device.currency,
          settings.displayCurrency,
        )
      : null;

  if (edit === "1") {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-3xl mx-auto">
        <PageHeader title={`Edit ${device.name}`} />
        <DeviceForm
          mode="edit"
          device={device}
          groups={allGroups}
          brandSuggestions={Array.from(new Set(allDevices.map((d) => d.brand)))}
          resellerNames={resellers.map((r) => r.name)}
        />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 mb-6 border-b border-border/60">
        <div className="flex items-start gap-4">
          <BrandLogo brand={device.brand} size={56} />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{device.name}</h1>
            <div className="mt-1 text-sm text-muted-foreground">{device.brand}</div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
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
              {/* (already consistent; left untouched) */}
              <WarrantyBadge device={device} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/devices/${device.id}?edit=1`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Pencil className="size-4" />
            Edit
          </Link>
          <DeleteDeviceButton id={device.id} name={device.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-5">
        {/* Info card */}
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
          {/* Price block */}
          {device.pricePaid !== null && (
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
                {device.pricePaidBaseSnapshot !== null && device.baseCurrencyAtSnapshot && (
                  <ValueCell
                    label="At purchase"
                    value={formatMoney(
                      device.pricePaidBaseSnapshot,
                      device.baseCurrencyAtSnapshot,
                    )}
                    sub={
                      device.purchaseDate
                        ? format(new Date(device.purchaseDate), "MMM yyyy")
                        : "—"
                    }
                  />
                )}
                {livePrice !== null && (
                  <ValueCell
                    label="Today"
                    value={formatMoney(livePrice, settings.displayCurrency)}
                    sub={delta(device.pricePaidBaseSnapshot, livePrice)}
                  />
                )}
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-3 text-sm">
            <Row label="Purchased">
              {device.purchaseDate
                ? format(new Date(device.purchaseDate), "MMM d, yyyy")
                : "—"}
            </Row>
            <Row label="Where">{device.purchaseLocation ?? "—"}</Row>
            <Row label="Condition">
              <span className="capitalize">{device.condition ?? "—"}</span>
            </Row>
            <Row label="Warranty">
              {device.warrantyMonths
                ? `${device.warrantyMonths} months${
                    warrantyEndsAt(device)
                      ? ` (until ${format(warrantyEndsAt(device)!, "MMM yyyy")})`
                      : ""
                  }`
                : "—"}
            </Row>
            <Row label="Age">
              {ageInYears(device) !== null ? `${ageInYears(device)} years` : "—"}
            </Row>
            <Row label="Renewal target">
              {device.expectedRenewalDate
                ? format(new Date(device.expectedRenewalDate), "MMM yyyy")
                : "—"}
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
        </div>

        {/* Right column: timeline + siblings */}
        <div className="space-y-5">
          <DeviceTimeline device={device} />
          {siblings.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-card p-5">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
                Group siblings
              </h3>
              <div className="divide-y divide-border/60">
                {siblings.map((s) => (
                  <Link
                    key={s.id}
                    href={`/devices/${s.id}`}
                    className="flex items-center gap-3 py-3 hover:opacity-80"
                  >
                    <BrandLogo brand={s.brand} size={28} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{s.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {s.brand}
                      </div>
                    </div>
                    <CategoryChip
                      category={s.category}
                      className="ml-auto"
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
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
