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
  // Stored verbatim; we only validate that it's a non-empty string. The form
  // normalizes "amazon.com" → "https://amazon.com" before submission.
  url: z.string().min(1),
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

export const SettingsSchema = z.object({
  displayCurrency: z.string().length(3).default("EUR"),
  defaultInputCurrency: z.string().length(3).default("KRW"),
  dateFormat: z.string().default("yyyy-MM-dd"),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  displayCurrency: "EUR",
  defaultInputCurrency: "KRW",
  dateFormat: "yyyy-MM-dd",
};
