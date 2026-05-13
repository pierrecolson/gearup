import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Look up product releases for a model family (e.g. "MacBook Pro 14") via
 * Claude Haiku 4.5 with structured outputs + disk cache.
 *
 * Lookup order:
 *   1. Disk cache (TTL 30 days; manual edits are also stored here so they
 *      take precedence over AI results)
 *   2. Anthropic API — if `ANTHROPIC_API_KEY` is set
 *   3. Empty array — graceful failure
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
    // Manual edits never expire; AI/empty entries fall through after TTL so
    // we re-query Anthropic for fresher data.
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

// Stable system prompt — flagged for caching even though it's well under
// Haiku's 4K-token cache threshold. The marker is a no-op below the minimum
// cacheable prefix; left in place so the prompt can be cheaply extended later.
const SYSTEM_PROMPT = `You catalog consumer-electronics product releases.

Given a product family name, list every major release in chronological order. Each release must be a real, shipping product — not concepts, prototypes, or rumors. Use the canonical product name as shipped by the manufacturer (e.g. "iPhone 15 Pro", "Sony α7 IV", "MacBook Pro 14 M3").

For releasedOn, return an ISO 8601 date string (YYYY-MM-DD). Use the first day of the month if only the month is known; the first day of the year if only the year is known. Return null only when the release date is genuinely unknown.

Your knowledge has a training cutoff — releases after that date may be missing. Return what you know. Do not invent products to fill perceived gaps. If the family is ambiguous, prefer the most prominent interpretation.`;

let _client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!_client) _client = new Anthropic();
  return _client;
}

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

async function callAnthropic(
  client: Anthropic,
  family: string,
): Promise<VersionEntry[] | null> {
  try {
    // `output_config` is a recent addition; the installed SDK may not type it
    // yet. Cast through `never` to bypass param typing, then narrow the response.
    const message = (await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2048,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Product family: "${family}". List every major release.`,
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: RESPONSE_JSON_SCHEMA,
        },
      },
    } as never)) as Anthropic.Message;

    const textBlock = message.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text",
    );
    if (!textBlock) return null;
    const parsed = ResponseSchema.safeParse(JSON.parse(textBlock.text));
    if (!parsed.success) return null;
    return parsed.data.releases;
  } catch {
    // Rate limits, network blips, refusals, schema misses — all degrade to
    // empty so the UI never crashes on a missing AI response.
    return null;
  }
}

/**
 * Returns releases for the given family. Reads cache first; on miss, calls
 * Anthropic if a key is configured; caches the result. Always resolves.
 */
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
        configured: Boolean(process.env.ANTHROPIC_API_KEY),
      };
    }
  }

  const client = getClient();
  if (!client) {
    // No key — don't write an empty cache entry; we want a real attempt the
    // moment a key is configured.
    return { entries: [], cached: false, source: "empty", configured: false };
  }

  const entries = await callAnthropic(client, family_);
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

/** Persist user-edited releases. Marks the entry as `manual` so AI won't overwrite. */
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
