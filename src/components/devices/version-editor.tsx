"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { isAfter, parseISO } from "date-fns";
import {
  ArrowsClockwise,
  CircleNotch,
  Plus,
  Trash,
} from "@phosphor-icons/react/ssr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";

export type VersionEntry = { name: string; releasedOn: string | null };

type LookupResult = {
  family: string;
  entries: VersionEntry[];
  cached: boolean;
  source: "ai" | "manual" | "empty";
  configured: boolean;
};

/**
 * In-panel editor for a model family's release list. Reads /api/versions
 * (which proxies Claude Haiku for AI lookups + disk cache for manual edits)
 * and lets the user add/delete rows. Persists via PUT.
 *
 * Calls `onChange(entries)` after every successful read or save so the parent
 * timeline can re-render with the latest list.
 */
export function VersionEditor({
  family,
  purchaseDate,
  onChange,
}: {
  family: string;
  purchaseDate?: string | null;
  onChange?: (entries: VersionEntry[]) => void;
}) {
  const [data, setData] = useState<LookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDate, setDraftDate] = useState("");
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Fetch on mount and whenever the family changes
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const res = await fetch(
        `/api/versions?family=${encodeURIComponent(family)}`,
      );
      if (cancelled) return;
      if (res.ok) {
        const json = (await res.json()) as LookupResult;
        setData(json);
        onChangeRef.current?.(json.entries);
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [family]);

  async function persist(entries: VersionEntry[]) {
    setSaving(true);
    const res = await fetch("/api/versions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ family, entries }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Could not save");
      return;
    }
    setData((d) =>
      d
        ? { ...d, entries, source: "manual", cached: true }
        : { family, entries, source: "manual", cached: true, configured: true },
    );
    onChangeRef.current?.(entries);
  }

  async function refresh() {
    setLoading(true);
    const res = await fetch(
      `/api/versions?family=${encodeURIComponent(family)}&refresh=1`,
    );
    setLoading(false);
    if (!res.ok) {
      toast.error("Refresh failed");
      return;
    }
    const json = (await res.json()) as LookupResult;
    setData(json);
    onChangeRef.current?.(json.entries);
    if (json.source === "empty" && !json.configured) {
      toast.message("Set OPENROUTER_API_KEY to enable AI lookup");
    } else if (json.source === "empty") {
      toast.message("No releases found — add them by hand below");
    } else {
      toast.success("Refreshed");
    }
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!draftName.trim()) return;
    const next: VersionEntry[] = [
      ...(data?.entries ?? []),
      { name: draftName.trim(), releasedOn: draftDate || null },
    ];
    void persist(next);
    setDraftName("");
    setDraftDate("");
  }

  function handleDelete(entry: VersionEntry) {
    const next = (data?.entries ?? []).filter(
      (e) => !(e.name === entry.name && e.releasedOn === entry.releasedOn),
    );
    void persist(next);
  }

  const allEntries = data?.entries ?? [];
  const today = useMemo(() => new Date(), []);
  const purchase = purchaseDate ? parseISO(purchaseDate) : null;
  // Display filter: only releases that shipped strictly after purchase and on
  // or before today. The unfiltered list still persists, so manual entries
  // outside the window aren't lost on save.
  const entries = allEntries.filter((e) => {
    if (!e.releasedOn) return false;
    const d = parseISO(e.releasedOn);
    if (Number.isNaN(d.getTime())) return false;
    if (purchase && !isAfter(d, purchase)) return false;
    if (isAfter(d, today)) return false;
    return true;
  });
  const hiddenCount = allEntries.length - entries.length;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Releases · {family}
        </h3>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          {loading ? (
            <CircleNotch className="size-3 animate-spin" />
          ) : (
            <ArrowsClockwise className="size-3" />
          )}
          {data?.source === "ai"
            ? "Refresh"
            : data?.source === "manual"
            ? "Reset to AI"
            : "Lookup"}
        </button>
      </div>

      {data?.source === "empty" && !data.configured && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          AI lookup not configured. Set <code>OPENROUTER_API_KEY</code> in{" "}
          <code>.env.local</code> and refresh, or add releases manually below.
        </p>
      )}

      {entries.length === 0 && !loading ? (
        <p className="text-xs text-muted-foreground italic">
          {allEntries.length === 0
            ? "No releases yet. Add one below."
            : "No newer releases since you bought it."}
        </p>
      ) : (
        <>
          <ul className="divide-y divide-border/60 rounded-lg border border-border/60 bg-card text-sm">
            {entries.map((e, i) => (
              <li
                key={`${e.name}-${i}`}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate">{e.name}</div>
                  <div className="text-xs text-muted-foreground tabular-nums">
                    {e.releasedOn ?? "Date unknown"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(e)}
                  aria-label="Delete release"
                  disabled={saving}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Trash className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          {hiddenCount > 0 && (
            <p className="text-xs text-muted-foreground italic">
              {hiddenCount} earlier release{hiddenCount === 1 ? "" : "s"} hidden.
            </p>
          )}
        </>
      )}

      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <Input
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          placeholder="e.g. MacBook Pro 14 M4"
          className="flex-1"
        />
        <DatePicker
          value={draftDate || null}
          onChange={(v) => setDraftDate(v ?? "")}
          placeholder="Release date"
          className="w-32"
          precisions={["day", "month", "year"]}
        />
        <Button type="submit" variant="outline" disabled={saving}>
          <Plus className="size-4" />
          Add
        </Button>
      </form>
    </section>
  );
}
