import "server-only";
import { z } from "zod";
import {
  BUILTIN_CATEGORIES,
  TONES,
  categorySlug,
  type CategoryDef,
  type Tone,
} from "./categories";
import { supabase } from "./supabase";

type CategoryRow = {
  id: string;
  label: string;
  tone: string;
  icon_slug: string | null;
};

const StoredCategorySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  tone: z.enum(TONES),
  iconSlug: z.string().nullable().optional(),
});

type StoredCategory = z.infer<typeof StoredCategorySchema>;

async function readStored(): Promise<StoredCategory[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, label, tone, icon_slug");
  if (error) throw error;
  return (data as CategoryRow[])
    .map((r) => ({
      id: r.id,
      label: r.label,
      tone: r.tone as Tone,
      iconSlug: r.icon_slug,
    }))
    .filter((c) => StoredCategorySchema.safeParse(c).success);
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
  const row: CategoryRow = {
    id,
    label: input.label.trim(),
    tone: input.tone,
    icon_slug: input.iconSlug ?? null,
  };
  const { error } = await supabase
    .from("categories")
    .upsert(row, { onConflict: "id" });
  if (error) throw error;
  return {
    id: row.id,
    label: row.label,
    tone: row.tone as Tone,
    iconSlug: row.icon_slug,
    builtin: BUILTIN_CATEGORIES.some((b) => b.id === id),
  };
}

/** Remove a user-added category. Built-ins can't be removed (silently no-op). */
export async function removeCategory(id: string): Promise<boolean> {
  const { error, count } = await supabase
    .from("categories")
    .delete({ count: "exact" })
    .eq("id", id);
  if (error) throw error;
  return (count ?? 0) > 0;
}
