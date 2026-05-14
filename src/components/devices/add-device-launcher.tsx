"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { AddDeviceDialog } from "./add-device-dialog";
import type { Device, Group } from "@/lib/types";

export function AddDeviceLauncher({
  groups,
  defaultInputCurrency,
  brandSuggestions = [],
  resellerNames = [],
  initialStatus = "owned",
  label,
}: {
  groups: Group[];
  defaultInputCurrency?: string;
  brandSuggestions?: string[];
  resellerNames?: string[];
  initialStatus?: Device["status"];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        {label ?? (initialStatus === "wishlist" ? "Add wish" : "Add device")}
      </Button>
      <AddDeviceDialog
        open={open}
        onOpenChange={setOpen}
        groups={groups}
        defaults={{ currency: defaultInputCurrency }}
        brandSuggestions={brandSuggestions}
        resellerNames={resellerNames}
        initialStatus={initialStatus}
      />
    </>
  );
}
