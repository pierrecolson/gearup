import "server-only";
import { nanoid } from "nanoid";
import {
  type Device,
  type DeviceInput,
  type Group,
  type GroupInput,
} from "./types";
import { snapshotPrice } from "./currency";
import { getSettings } from "./settings";
import { supabase } from "./supabase";

// Row shapes match the Postgres columns (snake_case). Mappers translate to/from
// the camelCase domain types used everywhere else in the app.

type DeviceRow = {
  id: string;
  name: string;
  brand: string;
  category: string;
  status: string;
  purchase_date: string | null;
  purchase_location: string | null;
  price_paid: number | null;
  currency: string;
  price_paid_base_snapshot: number | null;
  base_currency_at_snapshot: string | null;
  snapshot_rate: number | null;
  condition: string | null;
  warranty_months: number | null;
  receipt_number: string | null;
  receipt_file: string | null;
  serial_number: string | null;
  context: string;
  group_id: string | null;
  expected_renewal_date: string | null;
  track_versions: boolean;
  model_family: string | null;
  image_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type GroupRow = {
  id: string;
  name: string;
  color: string;
  cover_device_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function deviceFromRow(r: DeviceRow): Device {
  return {
    id: r.id,
    name: r.name,
    brand: r.brand,
    category: r.category,
    status: r.status as Device["status"],
    purchaseDate: r.purchase_date,
    purchaseLocation: r.purchase_location,
    pricePaid: r.price_paid,
    currency: r.currency,
    pricePaidBaseSnapshot: r.price_paid_base_snapshot,
    baseCurrencyAtSnapshot: r.base_currency_at_snapshot,
    snapshotRate: r.snapshot_rate,
    condition: r.condition as Device["condition"],
    warrantyMonths: r.warranty_months,
    receiptNumber: r.receipt_number,
    receiptFile: r.receipt_file,
    serialNumber: r.serial_number,
    context: r.context as Device["context"],
    groupId: r.group_id,
    expectedRenewalDate: r.expected_renewal_date,
    trackVersions: r.track_versions,
    modelFamily: r.model_family,
    imageUrl: r.image_url,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function deviceToRow(d: Device): DeviceRow {
  return {
    id: d.id,
    name: d.name,
    brand: d.brand,
    category: d.category,
    status: d.status,
    purchase_date: d.purchaseDate,
    purchase_location: d.purchaseLocation,
    price_paid: d.pricePaid,
    currency: d.currency,
    price_paid_base_snapshot: d.pricePaidBaseSnapshot,
    base_currency_at_snapshot: d.baseCurrencyAtSnapshot,
    snapshot_rate: d.snapshotRate,
    condition: d.condition,
    warranty_months: d.warrantyMonths,
    receipt_number: d.receiptNumber,
    receipt_file: d.receiptFile,
    serial_number: d.serialNumber,
    context: d.context,
    group_id: d.groupId,
    expected_renewal_date: d.expectedRenewalDate,
    track_versions: d.trackVersions,
    model_family: d.modelFamily,
    image_url: d.imageUrl,
    notes: d.notes,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  };
}

function groupFromRow(r: GroupRow): Group {
  return {
    id: r.id,
    name: r.name,
    color: r.color,
    coverDeviceId: r.cover_device_id,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function groupToRow(g: Group): GroupRow {
  return {
    id: g.id,
    name: g.name,
    color: g.color,
    cover_device_id: g.coverDeviceId,
    notes: g.notes,
    created_at: g.createdAt,
    updated_at: g.updatedAt,
  };
}

// Devices ---------------------------------------------------------------------

export async function listDevices(): Promise<Device[]> {
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as DeviceRow[]).map(deviceFromRow);
}

export async function getDevice(id: string): Promise<Device | null> {
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? deviceFromRow(data as DeviceRow) : null;
}

export async function createDevice(input: DeviceInput): Promise<Device> {
  const now = new Date().toISOString();
  const settings = await getSettings();
  const snapshot = await snapshotPrice({
    amount: input.pricePaid,
    from: input.currency,
    to: settings.displayCurrency,
    date: input.purchaseDate,
  });
  const device: Device = {
    id: nanoid(10),
    ...input,
    pricePaidBaseSnapshot: snapshot.baseAmount,
    baseCurrencyAtSnapshot: snapshot.baseCurrency,
    snapshotRate: snapshot.rate,
    createdAt: now,
    updatedAt: now,
  };
  const { error } = await supabase.from("devices").insert(deviceToRow(device));
  if (error) throw error;
  return device;
}

export async function updateDevice(
  id: string,
  patch: Partial<DeviceInput>,
): Promise<Device | null> {
  const current = await getDevice(id);
  if (!current) return null;
  const merged: Device = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  const priceChanged =
    patch.pricePaid !== undefined && patch.pricePaid !== current.pricePaid;
  const currencyChanged =
    patch.currency !== undefined && patch.currency !== current.currency;
  const dateChanged =
    patch.purchaseDate !== undefined &&
    patch.purchaseDate !== current.purchaseDate;
  if (priceChanged || currencyChanged || dateChanged) {
    const settings = await getSettings();
    const snapshot = await snapshotPrice({
      amount: merged.pricePaid,
      from: merged.currency,
      to: settings.displayCurrency,
      date: merged.purchaseDate,
    });
    merged.pricePaidBaseSnapshot = snapshot.baseAmount;
    merged.baseCurrencyAtSnapshot = snapshot.baseCurrency;
    merged.snapshotRate = snapshot.rate;
  }
  const { error } = await supabase
    .from("devices")
    .update(deviceToRow(merged))
    .eq("id", id);
  if (error) throw error;
  return merged;
}

export async function deleteDevice(id: string): Promise<boolean> {
  const { error, count } = await supabase
    .from("devices")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw error;
  return (count ?? 0) > 0;
}

// Groups ----------------------------------------------------------------------

export async function listGroups(): Promise<Group[]> {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as GroupRow[]).map(groupFromRow);
}

export async function getGroup(id: string): Promise<Group | null> {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? groupFromRow(data as GroupRow) : null;
}

export async function createGroup(input: GroupInput): Promise<Group> {
  const now = new Date().toISOString();
  const group: Group = {
    id: nanoid(10),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  const { error } = await supabase.from("groups").insert(groupToRow(group));
  if (error) throw error;
  return group;
}

export async function updateGroup(
  id: string,
  patch: Partial<GroupInput>,
): Promise<Group | null> {
  const current = await getGroup(id);
  if (!current) return null;
  const merged: Group = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("groups")
    .update(groupToRow(merged))
    .eq("id", id);
  if (error) throw error;
  return merged;
}

export async function deleteGroup(id: string): Promise<boolean> {
  // FK on devices.group_id is `on delete set null` — Postgres clears the
  // pointers automatically. No manual fan-out needed.
  const { error, count } = await supabase
    .from("groups")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw error;
  return (count ?? 0) > 0;
}
