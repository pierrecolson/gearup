import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AppShell } from "@/components/layout/app-shell";
import { CategoriesProvider } from "@/components/categories-provider";
import { DateFormatProvider } from "@/components/date-format-provider";
import { loadCategories } from "@/lib/categories-store";
import { listDevices } from "@/lib/store";
import { getSettings } from "@/lib/settings";
import { Toaster } from "@/components/ui/sonner";

// Root layout reads live state from Supabase (devices for sidebar counts,
// categories). Without this, Next prerenders the layout at build time and the
// sidebar badges + every child page get frozen to the build-time snapshot,
// including against out-of-band edits in Supabase.
export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GearUp",
  description: "Personal device cockpit — track gear, warranties, value.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [categories, devices, settings] = await Promise.all([
    loadCategories(),
    listDevices(),
    getSettings(),
  ]);
  // Count only "owned" devices per category — wishlist entries shouldn't make
  // a category appear non-empty.
  const categoryCounts: Record<string, number> = {};
  for (const d of devices) {
    if (d.status !== "owned") continue;
    categoryCounts[d.category] = (categoryCounts[d.category] ?? 0) + 1;
  }
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <CategoriesProvider categories={categories}>
            <DateFormatProvider value={settings.dateFormat}>
              <AppShell categories={categories} categoryCounts={categoryCounts}>
                {children}
              </AppShell>
            </DateFormatProvider>
          </CategoriesProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
