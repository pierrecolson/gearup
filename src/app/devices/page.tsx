import { Suspense } from "react";
import { listDevices, listGroups } from "@/lib/store";
import { listResellers } from "@/lib/resellers-store";
import { loadCategories } from "@/lib/categories-store";
import { findCategory } from "@/lib/categories";
import { PageHeader } from "@/components/page-header";
import { DeviceExplorer } from "@/components/devices/device-explorer";
import { CategoryIcon } from "@/components/category-icon";
import { ResellerLogo } from "@/components/resellers/reseller-logo";
import { EditCategoryDialog } from "@/components/layout/edit-category-dialog";

type SearchParams = Promise<{ category?: string; reseller?: string }>;

export default async function DevicesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { category, reseller } = await searchParams;
  const [devices, groups, categories, resellers] = await Promise.all([
    listDevices(),
    listGroups(),
    loadCategories(),
    listResellers(),
  ]);
  const owned = devices.filter((d) => d.status !== "wishlist");
  const activeCategory = category ? findCategory(category, categories) : null;
  const activeReseller = reseller
    ? resellers.find((r) => r.name === reseller) ?? {
        id: "free-text",
        name: reseller,
        url: "",
        notes: null,
        createdAt: "",
        updatedAt: "",
      }
    : null;

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-7xl mx-auto">
      {activeCategory ? (
        <PageHeader
          title={
            <span className="flex items-center gap-3">
              <CategoryIcon
                iconSlug={activeCategory.iconSlug}
                tone={activeCategory.tone}
                size={32}
              />
              {activeCategory.label}
            </span>
          }
          description={`Everything in your ${activeCategory.label.toLowerCase()} bucket.`}
          actions={<EditCategoryDialog category={activeCategory} />}
        />
      ) : activeReseller ? (
        <PageHeader
          title={
            <span className="flex items-center gap-3">
              {activeReseller.url && (
                <ResellerLogo
                  url={activeReseller.url}
                  name={activeReseller.name}
                  size={36}
                />
              )}
              <span>
                Bought from{" "}
                <span className="text-foreground">{activeReseller.name}</span>
              </span>
            </span>
          }
          description="Devices linked to this purchase location."
        />
      ) : (
        <PageHeader
          title="Devices"
          description="All your owned, sold, and retired gear."
        />
      )}
      <Suspense fallback={null}>
        <DeviceExplorer devices={owned} groups={groups} />
      </Suspense>
    </div>
  );
}
