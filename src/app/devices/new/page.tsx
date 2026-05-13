import { listDevices, listGroups } from "@/lib/store";
import { listResellers } from "@/lib/resellers-store";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/page-header";
import { DeviceForm } from "@/components/devices/device-form";
import type { Status } from "@/lib/types";

type SearchParams = Promise<{ status?: string }>;

export default async function NewDevicePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status } = await searchParams;
  const [devices, groups, settings, resellers] = await Promise.all([
    listDevices(),
    listGroups(),
    getSettings(),
    listResellers(),
  ]);
  const brandSuggestions = Array.from(
    new Set(devices.map((d) => d.brand)),
  ).sort();
  const initialStatus: Status = status === "wishlist" ? "wishlist" : "owned";

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-3xl mx-auto">
      <PageHeader
        title={initialStatus === "wishlist" ? "Add to wishlist" : "Add device"}
        description={
          initialStatus === "wishlist"
            ? "Track something you want to buy."
            : "Track a new piece of gear."
        }
      />
      <DeviceForm
        mode="create"
        groups={groups}
        defaults={{
          currency: settings.defaultInputCurrency,
          status: initialStatus,
        }}
        brandSuggestions={brandSuggestions}
        resellerNames={resellers.map((r) => r.name)}
      />
    </div>
  );
}
