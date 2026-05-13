"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  House,
  Stack,
  StackSimple,
  Sparkle,
  GearSix,
  Storefront,
  CaretDown,
} from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/utils";
import { type CategoryDef } from "@/lib/categories";
import { CategoryIcon } from "@/components/category-icon";
import { AddCategoryDialog } from "./add-category-dialog";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  matchPrefix?: string;
};

const TOP: NavItem[] = [
  { href: "/", label: "Dashboard", icon: House },
  { href: "/devices", label: "Devices", icon: Stack, matchPrefix: "/devices" },
  { href: "/wishlist", label: "Wishlist", icon: Sparkle },
  { href: "/groups", label: "Groups", icon: StackSimple, matchPrefix: "/groups" },
  { href: "/resellers", label: "Resellers", icon: Storefront, matchPrefix: "/resellers" },
];

const BOTTOM: NavItem[] = [
  { href: "/settings", label: "Settings", icon: GearSix },
];

export function SidebarNav({
  categories,
  categoryCounts,
  onNavigate,
}: {
  categories: CategoryDef[];
  categoryCounts: Record<string, number>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");
  const [showEmpty, setShowEmpty] = useState(false);

  const { visibleCategories, hiddenCount } = useMemo(() => {
    const nonEmpty = categories.filter((c) => (categoryCounts[c.id] ?? 0) > 0);
    const empty = categories.filter((c) => (categoryCounts[c.id] ?? 0) === 0);
    return {
      visibleCategories: showEmpty ? categories : nonEmpty,
      hiddenCount: empty.length,
    };
  }, [categories, categoryCounts, showEmpty]);

  return (
    <nav className="flex flex-col gap-0.5 px-2 py-3">
      {TOP.map((item) => (
        <SidebarLink
          key={item.href}
          item={item}
          pathname={pathname}
          activeCategory={activeCategory}
          onNavigate={onNavigate}
        />
      ))}

      <div className="mt-5 mb-1 px-3 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Categories
        </span>
        <AddCategoryDialog />
      </div>
      {visibleCategories.map((c) => {
        const href = `/devices?category=${encodeURIComponent(c.id)}`;
        const active =
          (pathname === "/devices" || pathname.startsWith("/devices?")) &&
          activeCategory === c.id;
        const count = categoryCounts[c.id] ?? 0;
        return (
          <Link
            key={c.id}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            )}
          >
            <CategoryIcon iconSlug={c.iconSlug} tone={c.tone} size={20} />
            <span className="truncate flex-1">{c.label}</span>
            {count > 0 && (
              <span className="text-[10px] tabular-nums text-muted-foreground/70">
                {count}
              </span>
            )}
          </Link>
        );
      })}
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setShowEmpty((v) => !v)}
          className="mt-1 flex items-center gap-2 px-3 py-1 text-[11px] text-muted-foreground/70 hover:text-foreground transition-colors"
        >
          <CaretDown
            className={cn(
              "size-3 transition-transform",
              showEmpty && "rotate-180",
            )}
          />
          {showEmpty ? "Hide empty" : `${hiddenCount} empty`}
        </button>
      )}

      <div className="mt-5">
        {BOTTOM.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            pathname={pathname}
            activeCategory={activeCategory}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </nav>
  );
}

function SidebarLink({
  item,
  pathname,
  activeCategory,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  activeCategory: string | null;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const isDevicesRoot =
    item.href === "/devices" && pathname === "/devices" && !activeCategory;
  const isPrefixMatch =
    !!item.matchPrefix &&
    item.matchPrefix !== "/devices" &&
    pathname.startsWith(item.matchPrefix + "/");
  const isExact = pathname === item.href && !activeCategory;
  const active = isDevicesRoot || isPrefixMatch || isExact;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
    >
      <Icon className="size-4" weight={active ? "fill" : "regular"} />
      <span>{item.label}</span>
    </Link>
  );
}
