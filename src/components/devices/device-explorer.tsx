"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  MagnifyingGlass,
  SquaresFour,
  List,
} from "@phosphor-icons/react/ssr";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeviceCard } from "./device-card";
import { DeviceRow, DeviceRowHeader } from "./device-row";
import { useCategories } from "@/components/categories-provider";
import { findCategory } from "@/lib/categories";
import type { Device, Group } from "@/lib/types";

type GroupBy = "none" | "brand" | "category" | "context" | "group" | "year";
type View = "grid" | "table";

export function DeviceExplorer({
  devices,
  groups,
  showWishlist = false,
}: {
  devices: Device[];
  groups: Group[];
  showWishlist?: boolean;
}) {
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category");
  const urlReseller = searchParams.get("reseller");
  const categories = useCategories();
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<GroupBy>("none");
  const [view, setView] = useState<View>("grid");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>(
    urlCategory ?? "all",
  );
  const [contextFilter, setContextFilter] = useState<string>("all");

  // When the user clicks a category in the sidebar, keep the local filter in sync.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategoryFilter(urlCategory ?? "all");
  }, [urlCategory]);

  const brands = useMemo(
    () => Array.from(new Set(devices.map((d) => d.brand))).sort(),
    [devices],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return devices.filter((d) => {
      if (term) {
        const hay =
          `${d.name} ${d.brand} ${d.notes ?? ""} ${d.serialNumber ?? ""}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (brandFilter !== "all" && d.brand !== brandFilter) return false;
      if (categoryFilter !== "all" && d.category !== categoryFilter) return false;
      if (contextFilter !== "all" && d.context !== contextFilter) return false;
      if (urlReseller && d.purchaseLocation !== urlReseller) return false;
      return true;
    });
  }, [devices, search, brandFilter, categoryFilter, contextFilter, urlReseller]);

  const grouped = useMemo(
    () => groupDevices(filtered, groupBy, groups, categories),
    [filtered, groupBy, groups, categories],
  );

  const addHref = showWishlist
    ? "/devices/new?status=wishlist"
    : "/devices/new";

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 lg:gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search devices…"
            className="pl-9"
          />
        </div>

        <Select value={groupBy} onValueChange={(v) => v && setGroupBy(v as GroupBy)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Group by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No grouping</SelectItem>
            <SelectItem value="brand">By brand</SelectItem>
            <SelectItem value="category">By category</SelectItem>
            <SelectItem value="context">By context</SelectItem>
            <SelectItem value="group">By group</SelectItem>
            <SelectItem value="year">By year</SelectItem>
          </SelectContent>
        </Select>

        <Select value={brandFilter} onValueChange={(v) => v && setBrandFilter(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All brands</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={(v) => v && setCategoryFilter(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={contextFilter} onValueChange={(v) => v && setContextFilter(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Context" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All contexts</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-1">
          <div className="hidden sm:flex items-center rounded-md border border-border p-0.5">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2"
              onClick={() => setView("grid")}
              aria-label="Grid view"
            >
              <SquaresFour className="size-4" />
            </Button>
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2"
              onClick={() => setView("table")}
              aria-label="Table view"
            >
              <List className="size-4" />
            </Button>
          </div>
          <Link href={addHref} className={buttonVariants()}>
            <Plus className="size-4" />
            Add {showWishlist ? "wish" : "device"}
          </Link>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState showWishlist={showWishlist} hasAnyDevices={devices.length > 0} />
      ) : (
        <div className="space-y-8">
          {grouped.map((g) => (
            <section key={g.key}>
              {groupBy !== "none" && (
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {g.label}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {g.devices.length} {g.devices.length === 1 ? "device" : "devices"}
                  </span>
                </div>
              )}
              {view === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {g.devices.map((d) => (
                    <DeviceCard key={d.id} device={d} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                  <DeviceRowHeader />
                  <div className="divide-y divide-border/60">
                    {g.devices.map((d) => (
                      <DeviceRow key={d.id} device={d} />
                    ))}
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({
  showWishlist,
  hasAnyDevices,
}: {
  showWishlist: boolean;
  hasAnyDevices: boolean;
}) {
  if (hasAnyDevices) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No devices match your filters.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-dashed border-border p-12 text-center">
      <h3 className="font-medium">
        {showWishlist ? "No wishes yet" : "No devices yet"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {showWishlist
          ? "Add things you'd like to own — they'll show up here."
          : "Start by adding your first device."}
      </p>
      <Link
        href={showWishlist ? "/devices/new?status=wishlist" : "/devices/new"}
        className={buttonVariants({ className: "mt-4" })}
      >
        <Plus className="size-4" />
        Add {showWishlist ? "wish" : "device"}
      </Link>
    </div>
  );
}

function groupDevices(
  devices: Device[],
  by: GroupBy,
  groups: Group[],
  categories: ReturnType<typeof useCategories>,
): Array<{ key: string; label: string; devices: Device[] }> {
  if (by === "none") {
    return [{ key: "all", label: "All", devices }];
  }
  const map = new Map<string, { label: string; devices: Device[] }>();
  for (const d of devices) {
    let key = "—";
    let label = "—";
    if (by === "brand") {
      key = d.brand;
      label = d.brand;
    } else if (by === "category") {
      key = d.category;
      label = findCategory(d.category, categories).label;
    } else if (by === "context") {
      key = d.context;
      label = d.context === "professional" ? "Professional" : "Personal";
    } else if (by === "group") {
      if (d.groupId) {
        const g = groups.find((g) => g.id === d.groupId);
        key = d.groupId;
        label = g?.name ?? "Unknown group";
      } else {
        key = "_ungrouped";
        label = "Ungrouped";
      }
    } else if (by === "year") {
      const y = d.purchaseDate ? d.purchaseDate.slice(0, 4) : "Undated";
      key = y;
      label = y;
    }
    const entry = map.get(key) ?? { label, devices: [] };
    entry.devices.push(d);
    map.set(key, entry);
  }
  return Array.from(map.entries())
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.devices.length - a.devices.length);
}
