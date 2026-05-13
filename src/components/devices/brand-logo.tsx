"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { brandLogoUrl } from "@/lib/brand-slug";
import { logoDevUrl } from "@/lib/brand-logo";

type Source = "logoDev" | "simpleIcons" | "fallback";

export function BrandLogo({
  brand,
  size = 24,
  className,
}: {
  brand: string;
  size?: number;
  className?: string;
}) {
  const logoDev = logoDevUrl(brand, Math.max(64, size * 2));
  const [source, setSource] = useState<Source>(
    logoDev ? "logoDev" : "simpleIcons",
  );
  const initial = brand.trim().charAt(0).toUpperCase() || "?";

  if (source === "fallback") {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-flex items-center justify-center rounded-md bg-muted text-muted-foreground font-medium",
          className,
        )}
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        {initial}
      </span>
    );
  }

  const url = source === "logoDev" ? logoDev! : brandLogoUrl(brand);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`${brand} logo`}
      width={size}
      height={size}
      onError={() =>
        setSource((s) => (s === "logoDev" ? "simpleIcons" : "fallback"))
      }
      className={cn("rounded-md object-contain bg-white", className)}
      style={{ width: size, height: size }}
    />
  );
}
