import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import { ResellerSchema, type Reseller, type ResellerInput } from "./types";
import { z } from "zod";

const STORE = path.join(process.cwd(), "data", "resellers.json");

async function read(): Promise<Reseller[]> {
  try {
    const raw = await fs.readFile(STORE, "utf8");
    const parsed = z.array(ResellerSchema).safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

async function write(items: Reseller[]) {
  await fs.mkdir(path.dirname(STORE), { recursive: true });
  await fs.writeFile(STORE, JSON.stringify(items, null, 2) + "\n", "utf8");
}

export async function listResellers(): Promise<Reseller[]> {
  return read();
}

export async function getReseller(id: string): Promise<Reseller | null> {
  const all = await read();
  return all.find((r) => r.id === id) ?? null;
}

export async function createReseller(input: ResellerInput): Promise<Reseller> {
  const now = new Date().toISOString();
  const reseller: Reseller = {
    id: nanoid(10),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  const all = await read();
  all.push(reseller);
  await write(all);
  return reseller;
}

export async function deleteReseller(id: string): Promise<boolean> {
  const all = await read();
  const next = all.filter((r) => r.id !== id);
  if (next.length === all.length) return false;
  await write(next);
  return true;
}
