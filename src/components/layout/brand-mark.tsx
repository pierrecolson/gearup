import Link from "next/link";

export function BrandMark() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 px-3 py-4 text-sm font-medium tracking-tight"
    >
      <span className="inline-flex size-7 items-center justify-center rounded-md bg-foreground text-background text-xs font-semibold">
        G
      </span>
      <span>GearUp</span>
    </Link>
  );
}
