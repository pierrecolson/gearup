import "server-only";
import { nanoid } from "nanoid";
import { type Reseller, type ResellerInput } from "./types";
import { supabase } from "./supabase";

type ResellerRow = {
  id: string;
  name: string;
  url: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function fromRow(r: ResellerRow): Reseller {
  return {
    id: r.id,
    name: r.name,
    url: r.url,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function toRow(r: Reseller): ResellerRow {
  return {
    id: r.id,
    name: r.name,
    url: r.url,
    notes: r.notes,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}

export async function listResellers(): Promise<Reseller[]> {
  const { data, error } = await supabase
    .from("resellers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as ResellerRow[]).map(fromRow);
}

export async function getReseller(id: string): Promise<Reseller | null> {
  const { data, error } = await supabase
    .from("resellers")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as ResellerRow) : null;
}

export async function createReseller(input: ResellerInput): Promise<Reseller> {
  const now = new Date().toISOString();
  const reseller: Reseller = {
    id: nanoid(10),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  const { error } = await supabase.from("resellers").insert(toRow(reseller));
  if (error) throw error;
  return reseller;
}

/**
 * Insert a reseller for `name` if one doesn't already exist (case-insensitive
 * match). Used when a device form's purchase location names a shop we don't
 * track yet — keeps /resellers and the datalist autocomplete in sync without
 * forcing users to register every shop manually.
 */
export async function ensureResellerByName(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  const existing = await listResellers();
  const match = existing.find(
    (r) => r.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (match) return;
  await createReseller({ name: trimmed, url: "", notes: null });
}

export async function deleteReseller(id: string): Promise<boolean> {
  const { error, count } = await supabase
    .from("resellers")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw error;
  return (count ?? 0) > 0;
}
