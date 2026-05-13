"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { dotClass, iconUrl, type Tone } from "@/lib/categories";

/**
 * Render a category's icon (from thiings, proxied) at the given pixel size.
 * If there's no icon assigned or the upstream fails, falls back to a
 * tone-colored dot at the same footprint so the row height doesn't shift.
 */
export function CategoryIcon({
  iconSlug,
  tone,
  size = 18,
  className,
}: {
  iconSlug: string | null;
  tone: Tone | string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = iconUrl(iconSlug, 128);

  if (!url || failed) {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-block rounded-full shrink-0",
          dotClass(tone),
          className,
        )}
        style={{ width: size * 0.55, height: size * 0.55 }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={cn("shrink-0 object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
