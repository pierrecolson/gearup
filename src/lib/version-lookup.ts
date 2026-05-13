import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import OpenAI from "openai";

/**
 * Look up product releases for a model family (e.g. "MacBook Pro 14") via
 * OpenRouter + strict JSON-schema structured outputs, with a disk cache.
 *
 * Lookup order:
 *   1. Disk cache (TTL 30 days for AI results; manual edits never expire)
 *   2. OpenRouter — if `OPENROUTER_API_KEY` is set
 *   3. Empty array — graceful failure
 *
 * Default model is `openai/gpt-5-mini` — cheap, fast, native strict JSON
 * schema support. Override with `OPENROUTER_MODEL` (e.g.
 * `google/gemini-2.5-flash`, `anthropic/claude-haiku-4-5`).
 */

export const VersionEntrySchema = z.object({
  name: z.string(),
  releasedOn: z.string().nullable(),
});

export type VersionEntry = z.infer<typeof VersionEntrySchema>;

const ResponseSchema = z.object({
  releases: z.array(VersionEntrySchema),
});

const CACHE_DIR = path.join(process.cwd(), "data", ".cache", "versions");
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DEFAULT_MODEL = "openai/gpt-5-mini";

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export type CacheRecord = {
  family: string;
  fetchedAt: string;
  source: "ai" | "manual" | "empty";
  entries: VersionEntry[];
};

async function readCache(family: string): Promise<CacheRecord | null> {
  try {
    const raw = await fs.readFile(
      path.join(CACHE_DIR, `${slug(family)}.json`),
      "utf8",
    );
    const rec = JSON.parse(raw) as CacheRecord;
    if (rec.source === "manual") return rec;
    if (Date.now() - new Date(rec.fetchedAt).getTime() > TTL_MS) return null;
    return rec;
  } catch {
    return null;
  }
}

async function writeCache(record: CacheRecord): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(
    path.join(CACHE_DIR, `${slug(record.family)}.json`),
    JSON.stringify(record, null, 2) + "\n",
    "utf8",
  );
}

const SYSTEM_PROMPT = `You catalog consumer-electronics product releases.

Given a product family name, list every major release in chronological order. Each release must be a real, shipping product — not concepts, prototypes, or rumors. Use the canonical product name as shipped by the manufacturer (e.g. "iPhone 15 Pro", "Sony α7 IV", "MacBook Pro 14 M3").

For releasedOn, return an ISO 8601 date string (YYYY-MM-DD). Use the first day of the month if only the month is known; the first day of the year if only the year is known. Return null only when the release date is genuinely unknown.

Your knowledge has a training cutoff — releases after that date may be missing. Return what you know. Do not invent products to fill perceived gaps. If the family is ambiguous, prefer the most prominent interpretation.`;

let _client: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (!process.env.OPENROUTER_API_KEY) return null;
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        // OpenRouter uses these for analytics / rankings — harmless to set.
        "HTTP-Referer": "https://github.com/pierrecolson/gearup",
        "X-Title": "GearUp",
      },
    });
  }
  return _client;
}

// OpenAI-style strict JSON schema. `additionalProperties: false` and complete
// `required` arrays are mandatory under strict mode.
const RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    releases: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          releasedOn: { type: ["string", "null"] },
        },
        required: ["name", "releasedOn"],
        additionalProperties: false,
      },
    },
  },
  required: ["releases"],
  additionalProperties: false,
} as const;

async function callLLM(
  client: OpenAI,
  family: string,
): Promise<VersionEntry[] | null> {
  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Product family: "${family}". List every major release.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "releases",
          strict: true,
          schema: RESPONSE_JSON_SCHEMA,
        },
      },
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) return null;
    const parsed = ResponseSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return null;
    return parsed.data.releases;
  } catch {
    // Rate limits, network, refusals, schema misses — all degrade to empty
    // so the UI never crashes on a missing AI response.
    return null;
  }
}

export async function lookupReleases(
  family: string,
  opts: { refresh?: boolean } = {},
): Promise<{
  entries: VersionEntry[];
  cached: boolean;
  source: "ai" | "manual" | "empty";
  configured: boolean;
}> {
  const family_ = family.trim();
  if (!family_) {
    return { entries: [], cached: false, source: "empty", configured: false };
  }

  if (!opts.refresh) {
    const cached = await readCache(family_);
    if (cached) {
      return {
        entries: cached.entries,
        cached: true,
        source: cached.source,
        configured: Boolean(process.env.OPENROUTER_API_KEY),
      };
    }
  }

  const client = getClient();
  if (!client) {
    return { entries: [], cached: false, source: "empty", configured: false };
  }

  const entries = await callLLM(client, family_);
  if (entries === null) {
    return { entries: [], cached: false, source: "empty", configured: true };
  }

  await writeCache({
    family: family_,
    fetchedAt: new Date().toISOString(),
    source: "ai",
    entries,
  });
  return { entries, cached: false, source: "ai", configured: true };
}

export async function setManualReleases(
  family: string,
  entries: VersionEntry[],
): Promise<void> {
  await writeCache({
    family: family.trim(),
    fetchedAt: new Date().toISOString(),
    source: "manual",
    entries,
  });
}
