// One-shot migration: pushes data/*.json + data/uploads/receipts/* into Supabase.
// Idempotent (upserts on id). Run from your laptop, not from Hostinger.
//
//   node --env-file=.env.local scripts/migrate-to-supabase.mjs
//
// Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const DATA_DIR = path.join(process.cwd(), "data");
const RECEIPTS_DIR = path.join(DATA_DIR, "uploads", "receipts");
const BUCKET = "receipts";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function readJson(name, fallback) {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, name), "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

const MIME = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

function deviceToRow(d) {
  return {
    id: d.id,
    name: d.name,
    brand: d.brand,
    category: d.category,
    status: d.status ?? "owned",
    purchase_date: d.purchaseDate ?? null,
    purchase_location: d.purchaseLocation ?? null,
    price_paid: d.pricePaid ?? null,
    currency: d.currency,
    price_paid_base_snapshot: d.pricePaidBaseSnapshot ?? null,
    base_currency_at_snapshot: d.baseCurrencyAtSnapshot ?? null,
    snapshot_rate: d.snapshotRate ?? null,
    condition: d.condition ?? null,
    warranty_months: d.warrantyMonths ?? null,
    receipt_number: d.receiptNumber ?? null,
    receipt_file: d.receiptFile ?? null,
    serial_number: d.serialNumber ?? null,
    context: d.context ?? "personal",
    group_id: d.groupId ?? null,
    expected_renewal_date: d.expectedRenewalDate ?? null,
    track_versions: d.trackVersions ?? false,
    model_family: d.modelFamily ?? null,
    image_url: d.imageUrl ?? null,
    notes: d.notes ?? null,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  };
}

function groupToRow(g) {
  return {
    id: g.id,
    name: g.name,
    color: g.color ?? "blue",
    cover_device_id: g.coverDeviceId ?? null,
    notes: g.notes ?? null,
    created_at: g.createdAt,
    updated_at: g.updatedAt,
  };
}

function categoryToRow(c) {
  return {
    id: c.id,
    label: c.label,
    tone: c.tone,
    icon_slug: c.iconSlug ?? null,
  };
}

function resellerToRow(r) {
  return {
    id: r.id,
    name: r.name,
    url: r.url,
    notes: r.notes ?? null,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}

async function upsert(table, rows, conflict = "id") {
  if (rows.length === 0) {
    console.log(`  ${table}: 0 rows (skipped)`);
    return;
  }
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: conflict });
  if (error) {
    console.error(`  ${table} FAILED:`, error.message);
    process.exit(1);
  }
  console.log(`  ${table}: ${rows.length} rows upserted`);
}

async function migrateReceipts() {
  let files;
  try {
    files = await fs.readdir(RECEIPTS_DIR);
  } catch {
    console.log("  receipts: directory missing (skipped)");
    return;
  }
  if (files.length === 0) {
    console.log("  receipts: 0 files (skipped)");
    return;
  }
  let uploaded = 0;
  for (const name of files) {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    const contentType = MIME[ext] ?? "application/octet-stream";
    const buf = await fs.readFile(path.join(RECEIPTS_DIR, name));
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(name, buf, { contentType, upsert: true });
    if (error) {
      console.error(`  receipt ${name} FAILED:`, error.message);
      process.exit(1);
    }
    uploaded++;
  }
  console.log(`  receipts: ${uploaded} files uploaded`);
}

console.log("Loading JSON files...");
const devices = await readJson("devices.json", []);
const groups = await readJson("groups.json", []);
const categories = await readJson("categories.json", []);
const resellers = await readJson("resellers.json", []);
const settings = await readJson("settings.json", null);

console.log("Pushing to Supabase...");
// Groups first (devices FK them).
await upsert("groups", groups.map(groupToRow));
await upsert("devices", devices.map(deviceToRow));
await upsert("categories", categories.map(categoryToRow));
await upsert("resellers", resellers.map(resellerToRow));

if (settings) {
  const { error } = await supabase
    .from("settings")
    .update({
      display_currency: settings.displayCurrency,
      default_input_currency: settings.defaultInputCurrency,
      date_format: settings.dateFormat,
      open_router_model: settings.openRouterModel ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) {
    console.error("  settings FAILED:", error.message);
    process.exit(1);
  }
  console.log("  settings: row id=1 updated");
}

await migrateReceipts();

console.log("\nDone.");
