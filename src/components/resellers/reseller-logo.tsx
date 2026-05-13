"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { googleFaviconUrl, logoDevDomainUrl } from "@/lib/reseller-logo";

type Source = "logoDev" | "googleFavicon" | "fallback";

export function ResellerLogo({
  url,
  name,
  size = 32,
  className,
}: {
  url: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const logoDev = logoDevDomainUrl(url, Math.max(64, size * 2));
  const google = googleFaviconUrl(url, Math.max(64, size * 2));
  const [source, setSource] = useState<Source>(
    logoDev ? "logoDev" : google ? "googleFavicon" : "fallback",
  );
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  if (source === "fallback") {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-flex items-center justify-center rounded-md bg-muted text-muted-foreground font-medium shrink-0",
          className,
        )}
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        {initial}
      </span>
    );
  }

  const src = source === "logoDev" ? logoDev! : google!;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${name} logo`}
      width={size}
      height={size}
      onError={() =>
        setSource((s) =>
          s === "logoDev" && google ? "googleFavicon" : "fallback",
        )
      }
      className={cn("rounded-md object-contain bg-white shrink-0", className)}
      style={{ width: size, height: size }}
    />
  );
}
