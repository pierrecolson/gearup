import { promises as fs } from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import {
  type Device,
  type DeviceInput,
  type Group,
  type GroupInput,
} from "./types";
import { snapshotPrice } from "./currency";
import { getSettings } from "./settings";

const DATA_DIR = path.join(process.cwd(), "data");
const DEVICES_PATH = path.join(DATA_DIR, "devices.json");
const GROUPS_PATH = path.join(DATA_DIR, "groups.json");

// In-process mutex: every write awaits the previous one. Prevents read-modify-
// write races within a single Next.js dev server. For our local-only use this
// is enough; the future GitHub-as-DB backend will need its own contention model.
let writeChain: Promise<unknown> = Promise.resolve();

async function withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = writeChain.then(fn, fn);
  writeChain = next.catch(() => undefined);
  return next;
}

async function ensureFile(filePath: string, fallback: string) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, fallback, "utf8");
  }
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  await ensureFile(filePath, JSON.stringify(fallback));
  const raw = await fs.readFile(filePath, "utf8");
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

// Devices ---------------------------------------------------------------------

export async function listDevices(): Promise<Device[]> {
  return readJson<Device[]>(DEVICES_PATH, []);
}

export async function getDevice(id: string): Promise<Device | null> {
  const devices = await listDevices();
  return devices.find((d) => d.id === id) ?? null;
}

export async function createDevice(input: DeviceInput): Promise<Device> {
  return withWriteLock(async () => {
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
    const devices = await listDevices();
    devices.push(device);
    await writeJson(DEVICES_PATH, devices);
    return device;
  });
}

export async function updateDevice(
  id: string,
  patch: Partial<DeviceInput>,
): Promise<Device | null> {
  return withWriteLock(async () => {
    const devices = await listDevices();
    const idx = devices.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    const current = devices[idx];
    const merged: Device = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    // Re-snapshot if price, currency, or purchaseDate changed
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
    devices[idx] = merged;
    await writeJson(DEVICES_PATH, devices);
    return merged;
  });
}

export async function deleteDevice(id: string): Promise<boolean> {
  return withWriteLock(async () => {
    const devices = await listDevices();
    const next = devices.filter((d) => d.id !== id);
    if (next.length === devices.length) return false;
    await writeJson(DEVICES_PATH, next);
    return true;
  });
}

// Groups ----------------------------------------------------------------------

export async function listGroups(): Promise<Group[]> {
  return readJson<Group[]>(GROUPS_PATH, []);
}

export async function getGroup(id: string): Promise<Group | null> {
  const groups = await listGroups();
  return groups.find((g) => g.id === id) ?? null;
}

export async function createGroup(input: GroupInput): Promise<Group> {
  return withWriteLock(async () => {
    const now = new Date().toISOString();
    const group: Group = {
      id: nanoid(10),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    const groups = await listGroups();
    groups.push(group);
    await writeJson(GROUPS_PATH, groups);
    return group;
  });
}

export async function updateGroup(
  id: string,
  patch: Partial<GroupInput>,
): Promise<Group | null> {
  return withWriteLock(async () => {
    const groups = await listGroups();
    const idx = groups.findIndex((g) => g.id === id);
    if (idx === -1) return null;
    const merged: Group = {
      ...groups[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    groups[idx] = merged;
    await writeJson(GROUPS_PATH, groups);
    return merged;
  });
}

export async function deleteGroup(id: string): Promise<boolean> {
  return withWriteLock(async () => {
    const groups = await listGroups();
    const next = groups.filter((g) => g.id !== id);
    if (next.length === groups.length) return false;
    await writeJson(GROUPS_PATH, next);
    // Also clear groupId on any device that pointed to it
    const devices = await listDevices();
    let dirty = false;
    for (const d of devices) {
      if (d.groupId === id) {
        d.groupId = null;
        d.updatedAt = new Date().toISOString();
        dirty = true;
      }
    }
    if (dirty) await writeJson(DEVICES_PATH, devices);
    return true;
  });
}
