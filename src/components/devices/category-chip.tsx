"use client";

import { cn } from "@/lib/utils";
import { chipClass } from "@/lib/categories";
import { useCategoryDef } from "@/components/categories-provider";

export function CategoryChip({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const def = useCategoryDef(category);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        chipClass(def.tone),
        className,
      )}
    >
      {def.label}
    </span>
  );
}
