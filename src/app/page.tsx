import Link from "next/link";
import { Plus } from "@phosphor-icons/react/ssr";
import { listDevices } from "@/lib/store";
import { listResellers } from "@/lib/resellers-store";
import { getSettings } from "@/lib/settings";
import {
  countByCategory,
  ownedDevices,
  recentDevices,
  spendByBrand,
  spendByReseller,
  totalInvestedFrozen,
  warrantiesExpiringSoon,
  warrantyStatus,
} from "@/lib/selectors";
import { formatMoney } from "@/lib/currency-format";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { StatTile } from "@/components/dashboard/stat-tile";
import { SpendByBrand } from "@/components/dashboard/spend-by-brand";
import { SpendByCategory } from "@/components/dashboard/spend-by-category";
import { SpendByReseller } from "@/components/dashboard/spend-by-reseller";
import { WarrantyFeed } from "@/components/dashboard/warranty-feed";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export default async function DashboardPage() {
  const [devices, settings, resellers] = await Promise.all([
    listDevices(),
    getSettings(),
    listResellers(),
  ]);
  const owned = ownedDevices(devices);
  const invested = totalInvestedFrozen(owned);
  const expiring = warrantiesExpiringSoon(owned, 90);
  const activeWarranties = owned.filter(
    (d) => warrantyStatus(d) === "active" || warrantyStatus(d) === "expiring-soon",
  ).length;
  const byBrand = spendByBrand(owned);
  const byCategory = countByCategory(owned);
  const resellerByName = new Map(resellers.map((r) => [r.name, r]));
  const byReseller = spendByReseller(owned, resellerByName);
  const recent = recentDevices(devices, 5);

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-7xl mx-auto">
      <PageHeader
        title="Overview"
        description="Everything you own, what it's worth, and when warranties run out."
        actions={
          <Link href="/devices/new" className={buttonVariants()}>
            <Plus className="size-4" />
            Add device
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatTile
          label="Total devices"
          value={String(owned.length)}
          hint={`${devices.length - owned.length} other (wishlist / sold / retired)`}
        />
        <StatTile
          label="Total invested"
          value={
            invested.amount > 0
              ? formatMoney(invested.amount, invested.currency)
              : "—"
          }
          hint={
            invested.missingSnapshots > 0
              ? `${invested.missingSnapshots} pending FX`
              : "at-purchase value (frozen)"
          }
        />
        <StatTile
          label="In warranty"
          value={String(activeWarranties)}
          hint={`of ${owned.length} owned`}
        />
        <StatTile
          label="Expiring < 90d"
          value={String(expiring.length)}
          tone={expiring.length > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-8">
        <Panel title="Spend by brand">
          <SpendByBrand data={byBrand} currency={settings.displayCurrency} />
        </Panel>
        <Panel title="By category">
          <SpendByCategory data={byCategory} currency={settings.displayCurrency} />
        </Panel>
        <Panel title="By reseller">
          <SpendByReseller data={byReseller} currency={settings.displayCurrency} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Warranty expiring soon
          </h2>
          <WarrantyFeed devices={expiring.slice(0, 5)} />
        </div>
        <div>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Recently added
          </h2>
          <RecentActivity devices={recent} />
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}
