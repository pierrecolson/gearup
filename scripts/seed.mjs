#!/usr/bin/env node
/**
 * Seed the local cockpit with a representative mix of gear.
 *
 * Run with the dev server up:
 *
 *   npm run dev     # in another terminal
 *   npm run seed
 *
 * Idempotent-ish: wipes the existing devices.json + groups.json + categories.json
 * before seeding so you can iterate quickly.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const BASE = process.env.GEARUP_URL || "http://localhost:3000";
const DATA = path.resolve("data");

async function wipe() {
  await fs.writeFile(path.join(DATA, "devices.json"), "[]\n");
  await fs.writeFile(path.join(DATA, "groups.json"), "[]\n");
  await fs.writeFile(path.join(DATA, "categories.json"), "[]\n");
}

async function postJson(url, body) {
  const res = await fetch(`${BASE}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${url} ${res.status}: ${text}`);
  }
  return res.json();
}

const CATEGORIES = [
  { label: "Drone", tone: "blue", iconSlug: "personal-drone" },
  { label: "E-bike", tone: "lime", iconSlug: "bicycle" },
];

const GROUPS = [
  {
    key: "a7iii-kit",
    name: "Sony α7 III Kit",
    color: "amber",
    notes: "Body, walkaround zoom, and the fast 35.",
  },
];

const DEVICES = [
  {
    name: "MacBook Pro 16 M1 Max",
    brand: "Apple",
    category: "laptop",
    status: "owned",
    purchaseDate: "2022-10-25",
    purchaseLocation: "Apple Store Gangnam",
    pricePaid: 4500000,
    currency: "KRW",
    condition: "new",
    warrantyMonths: 24,
    context: "professional",
    notes: "Maxed out memory. Bought just before the M2 announcement.",
  },
  {
    name: "iPhone 15 Pro",
    brand: "Apple",
    category: "phone",
    status: "owned",
    purchaseDate: "2023-09-22",
    purchaseLocation: "Apple Store Gangnam",
    pricePaid: 1500000,
    currency: "KRW",
    condition: "new",
    warrantyMonths: 24,
    context: "personal",
    notes: "256 GB · Natural Titanium",
    trackVersions: true,
    modelFamily: "iPhone",
  },
  {
    name: "iPad Pro 11 M2",
    brand: "Apple",
    category: "tablet",
    status: "owned",
    purchaseDate: "2023-04-10",
    purchaseLocation: "Coupang",
    pricePaid: 1200000,
    currency: "KRW",
    warrantyMonths: 24,
    context: "personal",
  },
  {
    name: "Studio Display 27",
    brand: "Apple",
    category: "peripheral",
    status: "owned",
    purchaseDate: "2023-04-10",
    purchaseLocation: "Apple Store Gangnam",
    pricePaid: 2300000,
    currency: "KRW",
    warrantyMonths: 12,
    context: "professional",
    notes: "5K · Nano-texture",
  },
  {
    name: "AirPods Pro 2",
    brand: "Apple",
    category: "audio",
    status: "owned",
    purchaseDate: "2023-09-22",
    pricePaid: 350000,
    currency: "KRW",
    warrantyMonths: 12,
    context: "personal",
  },
  {
    name: "Apple Watch Series 9",
    brand: "Apple",
    category: "wearable",
    status: "owned",
    purchaseDate: "2024-01-18",
    pricePaid: 580000,
    currency: "KRW",
    warrantyMonths: 12,
    context: "personal",
  },
  {
    name: "Sony α7 III",
    brand: "Sony",
    category: "camera",
    status: "owned",
    purchaseDate: "2020-06-15",
    purchaseLocation: "B&H Photo (NYC)",
    pricePaid: 1900,
    currency: "USD",
    warrantyMonths: 24,
    context: "personal",
    groupKey: "a7iii-kit",
    trackVersions: true,
    modelFamily: "Sony Alpha 7",
    notes: "Bought during a NY trip. Still my main body.",
  },
  {
    name: "Sony FE 24-70mm f/2.8 GM",
    brand: "Sony",
    category: "lens",
    status: "owned",
    purchaseDate: "2020-06-15",
    purchaseLocation: "B&H Photo (NYC)",
    pricePaid: 2200,
    currency: "USD",
    warrantyMonths: 24,
    context: "personal",
    groupKey: "a7iii-kit",
  },
  {
    name: "Sony FE 35mm f/1.8",
    brand: "Sony",
    category: "lens",
    status: "owned",
    purchaseDate: "2021-02-20",
    pricePaid: 950000,
    currency: "KRW",
    warrantyMonths: 24,
    context: "personal",
    groupKey: "a7iii-kit",
  },
  {
    name: "DJI Mini 3 Pro",
    brand: "DJI",
    category: "camera",
    status: "owned",
    purchaseDate: "2023-05-30",
    pricePaid: 950000,
    currency: "KRW",
    warrantyMonths: 12,
    context: "personal",
    notes: "Fly More combo. < 250 g.",
  },
  {
    name: "LG OLED C2 65",
    brand: "LG",
    category: "tv",
    status: "owned",
    purchaseDate: "2023-01-12",
    purchaseLocation: "LG Best Shop",
    pricePaid: 2500000,
    currency: "KRW",
    warrantyMonths: 24,
    context: "personal",
  },
  {
    name: "PlayStation 5",
    brand: "Sony",
    category: "console",
    status: "owned",
    purchaseDate: "2022-08-04",
    pricePaid: 750000,
    currency: "KRW",
    warrantyMonths: 12,
    context: "personal",
  },
  {
    name: "Nintendo Switch OLED",
    brand: "Nintendo",
    category: "console",
    status: "owned",
    purchaseDate: "2021-11-18",
    pricePaid: 420000,
    currency: "KRW",
    warrantyMonths: 12,
    context: "personal",
  },
  {
    name: "Bose QC 45",
    brand: "Bose",
    category: "audio",
    status: "owned",
    purchaseDate: "2023-03-08",
    pricePaid: 380000,
    currency: "KRW",
    warrantyMonths: 24,
    context: "personal",
    notes: "Travel set.",
  },
  {
    name: "Anker 737 Power Bank",
    brand: "Anker",
    category: "battery",
    status: "owned",
    purchaseDate: "2024-02-14",
    pricePaid: 180000,
    currency: "KRW",
    warrantyMonths: 18,
    context: "professional",
    notes: "24,000 mAh · 140 W.",
  },
  {
    name: "Logitech MX Master 3S",
    brand: "Logitech",
    category: "peripheral",
    status: "owned",
    purchaseDate: "2023-07-12",
    pricePaid: 130000,
    currency: "KRW",
    warrantyMonths: 12,
    context: "professional",
  },
  // Wishlist
  {
    name: "Leica Q3",
    brand: "Leica",
    category: "camera",
    status: "wishlist",
    currency: "EUR",
    context: "personal",
    notes: "The dream walkaround.",
  },
  {
    name: "Sony α7 V",
    brand: "Sony",
    category: "camera",
    status: "wishlist",
    currency: "KRW",
    context: "personal",
    trackVersions: true,
    modelFamily: "Sony Alpha 7",
  },
];

async function main() {
  console.log("Resetting local data files…");
  await wipe();

  console.log("Creating categories…");
  for (const c of CATEGORIES) {
    await postJson("/api/categories", c);
  }

  console.log("Creating groups…");
  const groupIds = {};
  for (const g of GROUPS) {
    const created = await postJson("/api/groups", {
      name: g.name,
      color: g.color,
      coverDeviceId: null,
      notes: g.notes ?? null,
    });
    groupIds[g.key] = created.id;
  }

  console.log(`Creating ${DEVICES.length} devices…`);
  for (const d of DEVICES) {
    const { groupKey, ...rest } = d;
    const payload = {
      // base defaults
      purchaseDate: null,
      purchaseLocation: null,
      pricePaid: null,
      currency: "KRW",
      condition: null,
      warrantyMonths: null,
      receiptNumber: null,
      receiptFile: null,
      serialNumber: null,
      context: "personal",
      groupId: groupKey ? groupIds[groupKey] : null,
      expectedRenewalDate: null,
      trackVersions: false,
      modelFamily: null,
      imageUrl: null,
      notes: null,
      ...rest,
    };
    process.stdout.write(`  · ${d.name}…`);
    const created = await postJson("/api/devices", payload);
    console.log(
      ` ${created.pricePaidBaseSnapshot != null ? `€${created.pricePaidBaseSnapshot.toFixed(0)}` : "(no snapshot)"}`,
    );
  }

  console.log("\nDone. Open http://localhost:3000.");
}

main().catch((err) => {
  console.error("\nSeed failed:", err.message);
  process.exit(1);
});
