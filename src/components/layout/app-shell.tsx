"use client";

import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";
import { List } from "@phosphor-icons/react/ssr";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SidebarNav } from "./sidebar-nav";
import { BrandMark } from "./brand-mark";
import { ThemeToggle } from "./theme-toggle";
import { DevicePanel } from "@/components/devices/device-panel";
import { SignOutButton } from "@/components/login/sign-out-button";
import type { CategoryDef } from "@/lib/categories";

export function AppShell({
  categories,
  categoryCounts,
  children,
}: {
  categories: CategoryDef[];
  categoryCounts: Record<string, number>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Skip the chrome on auth pages — login renders standalone, centered.
  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Persistent sidebar on lg+ — sticky so it stays put while content scrolls */}
      <aside className="hidden lg:flex sticky top-0 h-screen w-60 shrink-0 flex-col border-r border-border/60 bg-background">
        <BrandMark />
        <div className="flex-1 overflow-y-auto">
          <Suspense fallback={null}>
            <SidebarNav categories={categories} categoryCounts={categoryCounts} />
          </Suspense>
        </div>
        <div className="p-3 border-t border-border/60 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">v0.1.0</span>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/95 backdrop-blur px-3 py-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-label="Open navigation"
              className={buttonVariants({ variant: "ghost", size: "icon" })}
            >
              <List className="size-5" weight="regular" />
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <BrandMark />
              <Suspense fallback={null}>
                <SidebarNav
                  categories={categories}
                  categoryCounts={categoryCounts}
                  onNavigate={() => setOpen(false)}
                />
              </Suspense>
            </SheetContent>
          </Sheet>
          <BrandMark />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>

      {/* Global device panel — opens whenever `?d=<id>` is in the URL */}
      <Suspense fallback={null}>
        <DevicePanel />
      </Suspense>
    </div>
  );
}
