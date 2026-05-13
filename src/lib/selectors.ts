import {
  addMonths,
  differenceInDays,
  differenceInYears,
  isBefore,
} from "date-fns";
import type { Device } from "./types";

export type WarrantyStatus =
  | "active"
  | "expiring-soon"
  | "expired"
  | "none";

export function warrantyEndsAt(device: Device): Date | null {
  if (!device.purchaseDate || !device.warrantyMonths) return null;
  return addMonths(new Date(device.purchaseDate), device.warrantyMonths);
}

export function warrantyStatus(
  device: Device,
  asOf: Date = new Date(),
): WarrantyStatus {
  const end = warrantyEndsAt(device);
  if (!end) return "none";
  if (isBefore(end, asOf)) return "expired";
  const daysLeft = differenceInDays(end, asOf);
  if (daysLeft <= 90) return "expiring-soon";
  return "active";
}

export function warrantyDaysLeft(
  device: Device,
  asOf: Date = new Date(),
): number | null {
  const end = warrantyEndsAt(device);
  if (!end) return null;
  return differenceInDays(end, asOf);
}

export function ageInYears(
  device: Device,
  asOf: Date = new Date(),
): number | null {
  if (!device.purchaseDate) return null;
  return differenceInYears(asOf, new Date(device.purchaseDate));
}

export function totalInvestedFrozen(devices: Device[]): {
  amount: number;
  currency: string;
  missingSnapshots: number;
} {
  let amount = 0;
  let currency = "EUR";
  let missing = 0;
  for (const d of devices) {
    if (d.status !== "owned") continue;
    if (d.pricePaidBaseSnapshot === null) {
      if (d.pricePaid !== null) missing++;
      continue;
    }
    amount += d.pricePaidBaseSnapshot;
    if (d.baseCurrencyAtSnapshot) currency = d.baseCurrencyAtSnapshot;
  }
  return { amount, currency, missingSnapshots: missing };
}

export function countByCategory(
  devices: Device[],
): Array<{ category: string; count: number; value: number }> {
  const map = new Map<string, { count: number; value: number }>();
  for (const d of devices) {
    if (d.status !== "owned") continue;
    const entry = map.get(d.category) ?? { count: 0, value: 0 };
    entry.count += 1;
    entry.value += d.pricePaidBaseSnapshot ?? 0;
    map.set(d.category, entry);
  }
  return Array.from(map.entries())
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.value - a.value);
}

export function spendByReseller(
  devices: Device[],
  resellerByName: Map<string, { id: string; name: string; url: string }>,
): Array<{ key: string; name: string; url: string | null; value: number; count: number }> {
  const map = new Map<
    string,
    { name: string; url: string | null; value: number; count: number }
  >();
  for (const d of devices) {
    if (d.status !== "owned") continue;
    const raw = d.purchaseLocation?.trim();
    if (!raw) continue;
    const matched = resellerByName.get(raw);
    const key = matched ? matched.id : `__unmatched:${raw}`;
    const entry = map.get(key) ?? {
      name: raw,
      url: matched?.url ?? null,
      value: 0,
      count: 0,
    };
    entry.value += d.pricePaidBaseSnapshot ?? 0;
    entry.count += 1;
    map.set(key, entry);
  }
  return Array.from(map.entries())
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.value - a.value);
}

export function spendByBrand(
  devices: Device[],
  topN = 8,
): Array<{ brand: string; value: number; count: number }> {
  const map = new Map<string, { value: number; count: number }>();
  for (const d of devices) {
    if (d.status !== "owned") continue;
    const entry = map.get(d.brand) ?? { value: 0, count: 0 };
    entry.value += d.pricePaidBaseSnapshot ?? 0;
    entry.count += 1;
    map.set(d.brand, entry);
  }
  const sorted = Array.from(map.entries())
    .map(([brand, v]) => ({ brand, ...v }))
    .sort((a, b) => b.value - a.value);
  if (sorted.length <= topN) return sorted;
  const top = sorted.slice(0, topN);
  const rest = sorted.slice(topN);
  const otherValue = rest.reduce((s, r) => s + r.value, 0);
  const otherCount = rest.reduce((s, r) => s + r.count, 0);
  return [...top, { brand: "Other", value: otherValue, count: otherCount }];
}

export function warrantiesExpiringSoon(
  devices: Device[],
  withinDays = 90,
  asOf: Date = new Date(),
): Device[] {
  return devices
    .filter((d) => d.status === "owned")
    .map((d) => ({ d, days: warrantyDaysLeft(d, asOf) }))
    .filter(
      (x): x is { d: Device; days: number } =>
        x.days !== null && x.days >= 0 && x.days <= withinDays,
    )
    .sort((a, b) => a.days - b.days)
    .map((x) => x.d);
}

export function ownedDevices(devices: Device[]): Device[] {
  return devices.filter((d) => d.status === "owned");
}

export function recentDevices(devices: Device[], n = 5): Device[] {
  return [...devices]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, n);
}
