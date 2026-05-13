import Link from "next/link";
import { listDevices, listGroups } from "@/lib/store";
import { formatMoney } from "@/lib/currency-format";
import { PageHeader } from "@/components/page-header";
import { BrandLogo } from "@/components/devices/brand-logo";
import { CreateGroupButton } from "@/components/groups/create-group-button";

export default async function GroupsPage() {
  const [groups, devices] = await Promise.all([listGroups(), listDevices()]);

  const enriched = groups.map((g) => {
    const members = devices.filter((d) => d.groupId === g.id);
    const totalFrozen = members.reduce(
      (sum, m) => sum + (m.pricePaidBaseSnapshot ?? 0),
      0,
    );
    const cover = g.coverDeviceId
      ? members.find((m) => m.id === g.coverDeviceId)
      : members[0];
    const baseCurrency =
      members.find((m) => m.baseCurrencyAtSnapshot)?.baseCurrencyAtSnapshot ?? "EUR";
    return { group: g, members, totalFrozen, cover, baseCurrency };
  });

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-7xl mx-auto">
      <PageHeader
        title="Groups"
        description="Bundle related devices — like a camera with its lenses."
        actions={<CreateGroupButton />}
      />

      {enriched.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <h3 className="font-medium">No groups yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a group, then assign devices to it from each device&apos;s edit page.
          </p>
          <div className="mt-4 inline-flex">
            <CreateGroupButton />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {enriched.map(({ group, members, totalFrozen, cover, baseCurrency }) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="rounded-xl border border-border/60 bg-card p-5 hover:border-foreground/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                {cover ? (
                  <BrandLogo brand={cover.brand} size={32} />
                ) : (
                  <div className="size-8 rounded-md bg-muted" />
                )}
                <span className="text-xs text-muted-foreground">
                  {members.length} {members.length === 1 ? "device" : "devices"}
                </span>
              </div>
              <h3 className="font-medium tracking-tight">{group.name}</h3>
              {group.notes && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {group.notes}
                </p>
              )}
              {totalFrozen > 0 && (
                <div className="mt-4 text-sm font-medium tabular-nums">
                  {formatMoney(totalFrozen, baseCurrency)}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
