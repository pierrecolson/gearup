import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  BUILTIN_CATEGORIES,
  TONES,
  categorySlug,
  type CategoryDef,
} from "./categories";

const STORE = path.join(process.cwd(), "data", "categories.json");

const StoredCategorySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  tone: z.enum(TONES),
  iconSlug: z.string().nullable().optional(),
});

type StoredCategory = z.infer<typeof StoredCategorySchema>;

async function readStored(): Promise<StoredCategory[]> {
  try {
    const raw = await fs.readFile(STORE, "utf8");
    const parsed = z.array(StoredCategorySchema).safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

async function writeStored(items: StoredCategory[]): Promise<void> {
  await fs.mkdir(path.dirname(STORE), { recursive: true });
  await fs.writeFile(STORE, JSON.stringify(items, null, 2) + "\n", "utf8");
}

/** All categories merged: built-ins first, then user-defined. */
export async function loadCategories(): Promise<CategoryDef[]> {
  const stored = await readStored();
  // De-dupe by id — if a user-defined category collides with a built-in (e.g.
  // they wanted to rename "Laptop"), the user's version wins.
  const userMap = new Map(stored.map((s) => [s.id, s]));
  const builtins = BUILTIN_CATEGORIES.map((b) => {
    const override = userMap.get(b.id);
    if (override) {
      userMap.delete(b.id);
      return {
        ...b,
        label: override.label,
        tone: override.tone,
        iconSlug: override.iconSlug ?? b.iconSlug,
      };
    }
    return b;
  });
  const customs: CategoryDef[] = Array.from(userMap.values()).map((s) => ({
    id: s.id,
    label: s.label,
    tone: s.tone,
    iconSlug: s.iconSlug ?? null,
    builtin: false,
  }));
  return [...builtins, ...customs];
}

export const AddCategoryInputSchema = z.object({
  // When provided, treats this as an upsert (used by edits to keep the id
  // stable across label changes — avoids orphaning devices that reference it).
  id: z.string().min(1).optional(),
  label: z.string().min(1).max(40),
  tone: z.enum(TONES),
  iconSlug: z.string().nullable().optional(),
});

export type AddCategoryInput = z.infer<typeof AddCategoryInputSchema>;

export async function addCategory(input: AddCategoryInput): Promise<CategoryDef> {
  const id = input.id ?? categorySlug(input.label);
  if (!id) throw new Error("Invalid label");
  const stored = await readStored();
  const next: StoredCategory = {
    id,
    label: input.label.trim(),
    tone: input.tone,
    iconSlug: input.iconSlug ?? null,
  };
  const without = stored.filter((c) => c.id !== id);
  without.push(next);
  await writeStored(without);
  return {
    id: next.id,
    label: next.label,
    tone: next.tone,
    iconSlug: next.iconSlug ?? null,
    builtin: BUILTIN_CATEGORIES.some((b) => b.id === id),
  };
}

/** Remove a user-added category. Built-ins can't be removed (silently no-op). */
export async function removeCategory(id: string): Promise<boolean> {
  const stored = await readStored();
  const next = stored.filter((c) => c.id !== id);
  if (next.length === stored.length) return false;
  await writeStored(next);
  return true;
}
