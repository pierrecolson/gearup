import Link from "next/link";
import { ArrowSquareOut } from "@phosphor-icons/react/ssr";
import { listResellers } from "@/lib/resellers-store";
import { listDevices } from "@/lib/store";
import { PageHeader } from "@/components/page-header";
import { ResellerLogo } from "@/components/resellers/reseller-logo";
import { CreateResellerDialog } from "@/components/resellers/create-reseller-dialog";
import { DeleteResellerButton } from "@/components/resellers/delete-reseller-button";

export default async function ResellersPage() {
  const [resellers, devices] = await Promise.all([
    listResellers(),
    listDevices(),
  ]);

  // How many devices reference each reseller by name?
  const usageByName = new Map<string, number>();
  for (const d of devices) {
    if (d.purchaseLocation) {
      const k = d.purchaseLocation;
      usageByName.set(k, (usageByName.get(k) ?? 0) + 1);
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-7xl mx-auto">
      <PageHeader
        title="Resellers"
        description="Stores and sellers you buy from. Logos auto-fetched."
        actions={<CreateResellerDialog />}
      />

      {resellers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <h3 className="font-medium">No resellers yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first shop — Amazon, Apple Store, Coupang, B&amp;H Photo…
          </p>
          <div className="mt-4 inline-flex">
            <CreateResellerDialog />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {resellers
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((r) => {
              const count = usageByName.get(r.name) ?? 0;
              return (
                <div
                  key={r.id}
                  className="group rounded-xl border border-border/60 bg-card p-5 flex flex-col transition-colors hover:border-foreground/20"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <ResellerLogo url={r.url} name={r.name} size={44} />
                    <DeleteResellerButton id={r.id} name={r.name} />
                  </div>
                  <h3 className="font-medium tracking-tight">{r.name}</h3>
                  {r.url ? (
                    <Link
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 text-xs text-muted-foreground hover:underline inline-flex items-center gap-1 truncate"
                    >
                      {r.url.replace(/^https?:\/\//, "")}
                      <ArrowSquareOut className="size-3 shrink-0" />
                    </Link>
                  ) : (
                    <span className="mt-0.5 text-xs text-muted-foreground italic">
                      No website yet
                    </span>
                  )}
                  {r.notes && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                      {r.notes}
                    </p>
                  )}
                  <Link
                    href={`/devices?reseller=${encodeURIComponent(r.name)}`}
                    className="mt-3 pt-3 border-t border-border/60 text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center justify-between gap-1"
                  >
                    <span>
                      {count} {count === 1 ? "device" : "devices"}
                    </span>
                    {count > 0 && (
                      <span className="text-foreground/60 group-hover:text-foreground">
                        View →
                      </span>
                    )}
                  </Link>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
