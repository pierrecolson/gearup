import { z } from "zod";

// Category is now an open string — built-ins are listed in `categories.ts`
// (BUILTIN_CATEGORIES) and users can add their own through /api/categories.
// Validation only requires a non-empty slug.
export type Category = string;

export const CONDITIONS = ["new", "used", "refurbished"] as const;
export type Condition = (typeof CONDITIONS)[number];

export const CONTEXTS = ["personal", "professional"] as const;
export type Context = (typeof CONTEXTS)[number];

export const STATUSES = ["owned", "wishlist", "sold", "retired"] as const;
export type Status = (typeof STATUSES)[number];

export const DeviceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  category: z.string().min(1),
  status: z.enum(STATUSES).default("owned"),

  purchaseDate: z.string().nullable(),
  purchaseLocation: z.string().nullable(),
  pricePaid: z.number().nonnegative().nullable(),
  currency: z.string().length(3),

  pricePaidBaseSnapshot: z.number().nullable(),
  baseCurrencyAtSnapshot: z.string().length(3).nullable(),
  snapshotRate: z.number().positive().nullable(),

  condition: z.enum(CONDITIONS).nullable(),
  warrantyMonths: z.number().int().nonnegative().nullable(),
  receiptNumber: z.string().nullable(),
  receiptFile: z.string().nullable(),
  serialNumber: z.string().nullable(),

  context: z.enum(CONTEXTS).default("personal"),
  groupId: z.string().nullable(),

  expectedRenewalDate: z.string().nullable(),
  trackVersions: z.boolean().default(false),
  modelFamily: z.string().nullable(),

  imageUrl: z.string().nullable(),
  notes: z.string().nullable(),

  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Device = z.infer<typeof DeviceSchema>;

export const DeviceInputSchema = DeviceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  pricePaidBaseSnapshot: true,
  baseCurrencyAtSnapshot: true,
  snapshotRate: true,
}).extend({
  status: z.enum(STATUSES).default("owned"),
  currency: z.string().length(3).default("KRW"),
  context: z.enum(CONTEXTS).default("personal"),
  trackVersions: z.boolean().default(false),
});

export type DeviceInput = z.infer<typeof DeviceInputSchema>;

export const GroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.string().default("blue"),
  coverDeviceId: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Group = z.infer<typeof GroupSchema>;

export const GroupInputSchema = GroupSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type GroupInput = z.infer<typeof GroupInputSchema>;

export const ResellerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  // Stored verbatim. Empty when the reseller was auto-created from a device's
  // purchase location (the user can still add a URL later from /resellers).
  // The manual-creation dialog normalizes "amazon.com" → "https://amazon.com".
  url: z.string(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Reseller = z.infer<typeof ResellerSchema>;

export const ResellerInputSchema = ResellerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ResellerInput = z.infer<typeof ResellerInputSchema>;

export const DATE_FORMATS = [
  { value: "dd/MM/yyyy", label: "European", example: "14/05/2026" },
  { value: "yyyy.MM.dd", label: "Korean", example: "2026.05.14" },
  { value: "yyyy-MM-dd", label: "ISO 8601", example: "2026-05-14" },
  { value: "MM/dd/yyyy", label: "US", example: "05/14/2026" },
] as const;

export const DATE_FORMAT_VALUES = DATE_FORMATS.map((f) => f.value) as [
  (typeof DATE_FORMATS)[number]["value"],
  ...(typeof DATE_FORMATS)[number]["value"][],
];

export type DateFormat = (typeof DATE_FORMATS)[number]["value"];

export const SettingsSchema = z.object({
  displayCurrency: z.string().length(3).default("EUR"),
  defaultInputCurrency: z.string().length(3).default("KRW"),
  // Stored as a date-fns format token. Anything outside DATE_FORMAT_VALUES
  // falls back to the European default via the catch().
  dateFormat: z.enum(DATE_FORMAT_VALUES).catch("dd/MM/yyyy").default("dd/MM/yyyy"),
  // OpenRouter model ID used for AI version-release lookups. Null falls back
  // to OPENROUTER_MODEL env var, then to the hardcoded default. Stored as a
  // plain string so the user can pick any OpenRouter slug.
  openRouterModel: z.string().nullable().default(null),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  displayCurrency: "EUR",
  defaultInputCurrency: "KRW",
  dateFormat: "dd/MM/yyyy",
  openRouterModel: null,
};

/** Curated OpenRouter models surfaced as datalist suggestions in settings. */
export const OPENROUTER_MODEL_SUGGESTIONS = [
  "openai/gpt-5-mini",
  "openai/gpt-5",
  "openai/gpt-4o-mini",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "anthropic/claude-haiku-4-5",
  "anthropic/claude-sonnet-4-6",
  "meta-llama/llama-3.3-70b-instruct",
] as const;
