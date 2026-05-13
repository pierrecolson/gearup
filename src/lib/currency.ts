import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

export { formatMoney, COMMON_CURRENCIES } from "./currency-format";

const CACHE_DIR = path.join(process.cwd(), "data", ".cache", "rates");
const FRANKFURTER = "https://api.frankfurter.dev/v1";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function readCache(date: string): Promise<Record<string, number> | null> {
  try {
    const raw = await fs.readFile(path.join(CACHE_DIR, `${date}.json`), "utf8");
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return null;
  }
}

async function writeCache(
  date: string,
  rates: Record<string, number>,
): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(
    path.join(CACHE_DIR, `${date}.json`),
    JSON.stringify(rates, null, 2) + "\n",
    "utf8",
  );
}

type FrankfurterResponse = {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
};

async function fetchFrankfurter(
  date: string,
  from: string,
): Promise<{ effectiveDate: string; rates: Record<string, number> } | null> {
  // Frankfurter returns the most recent business day if `date` is a weekend or
  // before the earliest data — `effectiveDate` may differ from requested.
  const endpoint =
    date === todayIso() ? `${FRANKFURTER}/latest` : `${FRANKFURTER}/${date}`;
  const url = `${endpoint}?base=${from}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as FrankfurterResponse;
    return { effectiveDate: json.date, rates: json.rates };
  } catch {
    return null;
  }
}

/**
 * Look up a single rate `from -> to` on a given ISO date (defaults to today).
 * Disk-cached per `${effectiveDate}-${from}` so historical rates fetch once.
 */
export async function getRate(
  from: string,
  to: string,
  date?: string | null,
): Promise<number | null> {
  if (from === to) return 1;
  const requested = date || todayIso();
  const cacheKey = `${requested}-${from}`;
  const cached = await readCache(cacheKey);
  if (cached && typeof cached[to] === "number") return cached[to];

  const result = await fetchFrankfurter(requested, from);
  if (!result) return null;
  await writeCache(cacheKey, result.rates);
  if (result.effectiveDate !== requested) {
    await writeCache(`${result.effectiveDate}-${from}`, result.rates);
  }
  return result.rates[to] ?? null;
}

export type Snapshot = {
  baseAmount: number | null;
  baseCurrency: string | null;
  rate: number | null;
};

export async function snapshotPrice(params: {
  amount: number | null;
  from: string;
  to: string;
  date: string | null;
}): Promise<Snapshot> {
  if (params.amount === null || params.amount === undefined) {
    return { baseAmount: null, baseCurrency: null, rate: null };
  }
  const rate = await getRate(params.from, params.to, params.date);
  if (rate === null) {
    return { baseAmount: null, baseCurrency: null, rate: null };
  }
  return {
    baseAmount: round2(params.amount * rate),
    baseCurrency: params.to,
    rate,
  };
}

export async function liveConvert(
  amount: number,
  from: string,
  to: string,
): Promise<number | null> {
  const rate = await getRate(from, to);
  if (rate === null) return null;
  return round2(amount * rate);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
