import Link from "next/link";
import { ResellerLogo } from "@/components/resellers/reseller-logo";
import { formatMoney } from "@/lib/currency-format";

type Row = {
  key: string;
  name: string;
  url: string | null;
  value: number;
  count: number;
};

export function SpendByReseller({
  data,
  currency,
}: {
  data: Row[];
  currency: string;
}) {
  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
        Tag devices with a purchase location to see this.
      </div>
    );
  }
  const max = data[0]?.value ?? 1;

  return (
    <div className="space-y-2.5">
      {data.slice(0, 8).map((row) => {
        const pct = max === 0 ? 0 : (row.value / max) * 100;
        return (
          <div key={row.key} className="flex items-center gap-3">
            {row.url ? (
              <ResellerLogo url={row.url} name={row.name} size={24} />
            ) : (
              <span
                aria-hidden
                className="inline-flex items-center justify-center size-6 rounded-md bg-muted text-muted-foreground text-xs font-medium shrink-0"
              >
                {row.name.charAt(0).toUpperCase() || "?"}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-sm truncate">{row.name}</span>
                <span className="text-sm font-medium tabular-nums shrink-0">
                  {row.value > 0 ? formatMoney(row.value, currency) : "—"}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-foreground/70 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
      {data.length > 8 && (
        <Link
          href="/resellers"
          className="block pt-1 text-xs text-muted-foreground hover:text-foreground"
        >
          + {data.length - 8} more
        </Link>
      )}
    </div>
  );
}
