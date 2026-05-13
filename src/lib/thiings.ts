import "server-only";

const BASE = process.env.THIINGS_API_URL || "";
const KEY = process.env.THIINGS_API_KEY || "";

export type ThiingsIcon = {
  title: string;
  slug: string;
  category: string;
  tags: string[];
  file_name: string;
};

type SearchResponse = {
  total: number;
  limit: number;
  offset: number;
  icons: ThiingsIcon[];
};

function configured(): boolean {
  return BASE.length > 0 && KEY.length > 0;
}

export async function searchIcons(
  query: string,
  limit = 8,
): Promise<ThiingsIcon[]> {
  if (!configured() || !query.trim()) return [];
  const url = `${BASE}/icons?search=${encodeURIComponent(query.trim())}&limit=${limit}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${KEY}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as SearchResponse;
    return data.icons;
  } catch {
    return [];
  }
}

/**
 * Stream a single icon PNG. Returns null if the upstream isn't reachable or
 * the slug doesn't exist; the caller renders a fallback.
 */
export async function fetchIconImage(
  slug: string,
  size: number,
): Promise<{ buffer: ArrayBuffer; contentType: string } | null> {
  if (!configured()) return null;
  const url = `${BASE}/icons/${encodeURIComponent(slug)}/image?size=${size}`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${KEY}` },
    });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    return {
      buffer,
      contentType: res.headers.get("Content-Type") ?? "image/png",
    };
  } catch {
    return null;
  }
}
