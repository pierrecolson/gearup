import { Suspense } from "react";
import { listDevices, listGroups } from "@/lib/store";
import { listResellers } from "@/lib/resellers-store";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/page-header";
import { DeviceExplorer } from "@/components/devices/device-explorer";

export default async function WishlistPage() {
  const [devices, groups, resellers, settings] = await Promise.all([
    listDevices(),
    listGroups(),
    listResellers(),
    getSettings(),
  ]);
  const wishes = devices.filter((d) => d.status === "wishlist");
  const brandSuggestions = Array.from(new Set(devices.map((d) => d.brand))).sort();

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-7xl mx-auto">
      <PageHeader
        title="Wishlist"
        description="Things you'd like to own."
      />
      <Suspense fallback={null}>
        <DeviceExplorer
          devices={wishes}
          groups={groups}
          showWishlist
          defaultInputCurrency={settings.defaultInputCurrency}
          brandSuggestions={brandSuggestions}
          resellerNames={resellers.map((r) => r.name)}
        />
      </Suspense>
    </div>
  );
}
