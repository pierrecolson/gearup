import { listDevices, listGroups } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { DeviceExplorer } from "@/components/devices/device-explorer";

export default async function WishlistPage() {
  const [devices, groups] = await Promise.all([listDevices(), listGroups()]);
  const wishes = devices.filter((d) => d.status === "wishlist");

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-7xl mx-auto">
      <PageHeader
        title="Wishlist"
        description="Things you'd like to own."
      />
      <DeviceExplorer devices={wishes} groups={groups} showWishlist />
    </div>
  );
}
