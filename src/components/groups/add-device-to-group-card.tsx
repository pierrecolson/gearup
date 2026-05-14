"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CircleNotch, Plus } from "@phosphor-icons/react/ssr";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { BrandLogo } from "@/components/devices/brand-logo";
import { CategoryChip } from "@/components/devices/category-chip";
import type { Device } from "@/lib/types";

/**
 * Card-shaped trigger that drops onto the group detail grid alongside member
 * cards. Opens a searchable picker of unassigned/other-group devices and
 * reassigns them to this group via PATCH /api/devices/[id].
 */
export function AddDeviceToGroupCard({
  groupId,
  candidates,
}: {
  groupId: string;
  candidates: Device[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function add(deviceId: string) {
    startTransition(async () => {
      const res = await fetch(`/api/devices/${deviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });
      if (!res.ok) {
        toast.error("Could not add to group");
        return;
      }
      toast.success("Added to group");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group block w-full rounded-xl border border-dashed border-border bg-transparent p-4 text-left transition-colors hover:border-foreground/40 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground group-hover:text-foreground transition-colors">
            {pending ? (
              <CircleNotch className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
          </span>
          <div className="min-w-0">
            <div className="text-sm font-medium">Add a device</div>
            <div className="text-xs text-muted-foreground">
              Pick an existing device to add to this group.
            </div>
          </div>
        </div>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Add a device to this group"
        description="Search for a device you already own."
      >
        <CommandInput placeholder="Search devices…" />
        <CommandList>
          <CommandEmpty>
            {candidates.length === 0
              ? "Every device is already in this group."
              : "No matching devices."}
          </CommandEmpty>
          <CommandGroup>
            {candidates.map((d) => (
              <CommandItem
                key={d.id}
                value={`${d.name} ${d.brand}`}
                onSelect={() => add(d.id)}
              >
                <BrandLogo brand={d.brand} size={22} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{d.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {d.brand}
                  </div>
                </div>
                <CategoryChip category={d.category} />
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
