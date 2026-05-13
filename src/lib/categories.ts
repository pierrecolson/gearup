/**
 * Category model. Pierre's plan was originally a fixed enum; now categories
 * are user-extensible. Built-ins are baked in here; user-added ones live in
 * `data/categories.json` and merge on top via `categories-store.ts`.
 */

export type CategoryDef = {
  id: string; // slug, lowercase, used as the value on Device.category
  label: string;
  tone: Tone;
  // Thiings icon slug (resolved via /api/thiings/image/<slug>). Null means
  // "no icon assigned" — the UI falls back to a colored dot.
  iconSlug: string | null;
  builtin: boolean;
};

export const TONES = [
  "slate",
  "gray",
  "zinc",
  "stone",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "pink",
  "rose",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "neutral",
] as const;

export type Tone = (typeof TONES)[number];

// Slugs are pre-picked from the thiings catalog (verified to exist in
// `thiings API/icons/icon-list.json` at 9000-icon volume).
export const BUILTIN_CATEGORIES: CategoryDef[] = [
  { id: "laptop", label: "Laptop", tone: "slate", iconSlug: "laptop", builtin: true },
  { id: "phone", label: "Phone", tone: "sky", iconSlug: "smartphone", builtin: true },
  { id: "tablet", label: "Tablet", tone: "indigo", iconSlug: "tablet", builtin: true },
  { id: "camera", label: "Camera", tone: "amber", iconSlug: "camera", builtin: true },
  { id: "lens", label: "Lens", tone: "orange", iconSlug: "meniscus-lens", builtin: true },
  { id: "tv", label: "TV", tone: "violet", iconSlug: "television", builtin: true },
  { id: "console", label: "Console", tone: "rose", iconSlug: "video-game-console", builtin: true },
  { id: "audio", label: "Audio", tone: "teal", iconSlug: "headphones", builtin: true },
  { id: "wearable", label: "Wearable", tone: "pink", iconSlug: "smartwatch", builtin: true },
  { id: "battery", label: "Battery", tone: "emerald", iconSlug: "battery", builtin: true },
  { id: "accessory", label: "Accessory", tone: "stone", iconSlug: "power-adapter", builtin: true },
  { id: "peripheral", label: "Peripheral", tone: "cyan", iconSlug: "keyboard", builtin: true },
  { id: "other", label: "Other", tone: "neutral", iconSlug: "more-icon", builtin: true },
];

// Tailwind v4 JIT needs every class to appear literally in source for it to
// generate. So we enumerate them here once per tone; lookups read from this
// table at render time. Add a new tone? Add a row here.
const CHIP: Record<Tone, string> = {
  slate: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  gray: "bg-gray-500/10 text-gray-700 dark:text-gray-300",
  zinc: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
  stone: "bg-stone-500/10 text-stone-700 dark:text-stone-300",
  sky: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  blue: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  indigo: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  violet: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  purple: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  pink: "bg-pink-500/10 text-pink-700 dark:text-pink-300",
  rose: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  red: "bg-red-500/10 text-red-700 dark:text-red-300",
  orange: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  yellow: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  lime: "bg-lime-500/10 text-lime-700 dark:text-lime-300",
  green: "bg-green-500/10 text-green-700 dark:text-green-300",
  emerald: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  teal: "bg-teal-500/10 text-teal-700 dark:text-teal-300",
  cyan: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  neutral: "bg-neutral-500/10 text-neutral-700 dark:text-neutral-300",
};

const DOT: Record<Tone, string> = {
  slate: "bg-slate-500",
  gray: "bg-gray-500",
  zinc: "bg-zinc-500",
  stone: "bg-stone-500",
  sky: "bg-sky-500",
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  purple: "bg-purple-500",
  pink: "bg-pink-500",
  rose: "bg-rose-500",
  red: "bg-red-500",
  orange: "bg-orange-500",
  amber: "bg-amber-500",
  yellow: "bg-yellow-500",
  lime: "bg-lime-500",
  green: "bg-green-500",
  emerald: "bg-emerald-500",
  teal: "bg-teal-500",
  cyan: "bg-cyan-500",
  neutral: "bg-neutral-500",
};

export function chipClass(tone: string): string {
  return CHIP[(tone as Tone) in CHIP ? (tone as Tone) : "neutral"];
}

export function dotClass(tone: string): string {
  return DOT[(tone as Tone) in DOT ? (tone as Tone) : "neutral"];
}

export function isValidTone(tone: string): tone is Tone {
  return (TONES as readonly string[]).includes(tone);
}

/** Find a category in a list. Returns a synthetic neutral entry for unknown ids. */
export function findCategory(id: string, all: CategoryDef[]): CategoryDef {
  return (
    all.find((c) => c.id === id) ?? {
      id,
      label: id,
      tone: "neutral",
      iconSlug: null,
      builtin: false,
    }
  );
}

/** Build the proxy URL for a thiings icon. Returns null when no slug. */
export function iconUrl(slug: string | null, size = 128): string | null {
  if (!slug) return null;
  return `/api/thiings/image/${encodeURIComponent(slug)}?size=${size}`;
}

/** Normalize a user-supplied label into a slug usable as Category.id. */
export function categorySlug(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
