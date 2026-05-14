"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CircleNotch } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Device, Group } from "@/lib/types";
import {
  type FormState,
  type Updater,
  IdentityFields,
  LifecycleFields,
  PurchaseFields,
  StatusFields,
  buildPayload,
  initialFromDevice,
} from "./device-form-fields";

type Mode = "create" | "edit";

export function DeviceForm({
  mode,
  device,
  groups,
  defaults,
  brandSuggestions = [],
  resellerNames = [],
}: {
  mode: Mode;
  device?: Device;
  groups: Group[];
  defaults?: { currency?: string; status?: Device["status"] };
  brandSuggestions?: string[];
  resellerNames?: string[];
}) {
  const router = useRouter();
  const [state, setState] = useState<FormState>(() =>
    initialFromDevice(device, defaults),
  );
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const isWishlist = state.status === "wishlist";

  const update: Updater = (key, value) => {
    setState((s) => ({ ...s, [key]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.name.trim() || !state.brand.trim()) {
      toast.error("Name and brand are required");
      return;
    }
    const payload = buildPayload(state);

    startTransition(async () => {
      const url = mode === "create" ? "/api/devices" : `/api/devices/${device!.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Could not save");
        return;
      }
      const saved = (await res.json()) as Device;
      toast.success(mode === "create" ? "Device added" : "Saved");
      router.push(`/devices?d=${saved.id}`);
      router.refresh();
    });
  }

  async function handleReceiptUpload(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    if (device?.id) form.append("deviceId", device.id);
    const res = await fetch("/api/uploads", { method: "POST", body: form });
    setUploading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Upload failed");
      return;
    }
    const data = (await res.json()) as { filename: string };
    update("receiptFile", data.filename);
    toast.success("Receipt attached");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      <Section title="Identity">
        <IdentityFields
          state={state}
          update={update}
          brandSuggestions={brandSuggestions}
        />
      </Section>

      <Section title="Status">
        <StatusFields state={state} update={update} />
      </Section>

      {!isWishlist && (
        <Section title="Purchase">
          <PurchaseFields
            state={state}
            update={update}
            resellerNames={resellerNames}
            onUploadReceipt={handleReceiptUpload}
            uploading={uploading}
          />
        </Section>
      )}

      <Section title="Group, notes & version tracking">
        <LifecycleFields state={state} update={update} groups={groups} />
      </Section>

      <Separator />

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <CircleNotch className="size-4 animate-spin" />}
          {mode === "create" ? "Add device" : "Save"}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
