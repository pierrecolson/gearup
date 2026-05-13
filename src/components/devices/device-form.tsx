"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CircleNotch, UploadSimple, X } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  CONDITIONS,
  CONTEXTS,
  STATUSES,
  type Device,
  type Group,
} from "@/lib/types";
import { useCategories } from "@/components/categories-provider";
import { COMMON_CURRENCIES } from "@/lib/currency-format";
import { BrandLogo } from "./brand-logo";

type Mode = "create" | "edit";

type FormState = {
  name: string;
  brand: string;
  category: string;
  status: string;
  purchaseDate: string;
  purchaseLocation: string;
  pricePaid: string;
  currency: string;
  condition: string;
  warrantyMonths: string;
  receiptNumber: string;
  receiptFile: string;
  serialNumber: string;
  context: string;
  groupId: string;
  expectedRenewalDate: string;
  trackVersions: boolean;
  modelFamily: string;
  imageUrl: string;
  notes: string;
};

function initialFromDevice(device?: Device, defaults?: Partial<FormState>): FormState {
  return {
    name: device?.name ?? "",
    brand: device?.brand ?? "",
    category: device?.category ?? "laptop",
    status: device?.status ?? defaults?.status ?? "owned",
    purchaseDate: device?.purchaseDate ?? "",
    purchaseLocation: device?.purchaseLocation ?? "",
    pricePaid: device?.pricePaid !== null && device?.pricePaid !== undefined ? String(device.pricePaid) : "",
    currency: device?.currency ?? defaults?.currency ?? "KRW",
    condition: device?.condition ?? "new",
    warrantyMonths:
      device?.warrantyMonths !== null && device?.warrantyMonths !== undefined
        ? String(device.warrantyMonths)
        : "",
    receiptNumber: device?.receiptNumber ?? "",
    receiptFile: device?.receiptFile ?? "",
    serialNumber: device?.serialNumber ?? "",
    context: device?.context ?? "personal",
    groupId: device?.groupId ?? "",
    expectedRenewalDate: device?.expectedRenewalDate ?? "",
    trackVersions: device?.trackVersions ?? false,
    modelFamily: device?.modelFamily ?? "",
    imageUrl: device?.imageUrl ?? "",
    notes: device?.notes ?? "",
  };
}

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
  const categories = useCategories();
  const [state, setState] = useState<FormState>(() =>
    initialFromDevice(device, defaults),
  );
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const isWishlist = state.status === "wishlist";

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.name.trim() || !state.brand.trim()) {
      toast.error("Name and brand are required");
      return;
    }
    const payload = {
      name: state.name.trim(),
      brand: state.brand.trim(),
      category: state.category,
      status: state.status,
      purchaseDate: state.purchaseDate || null,
      purchaseLocation: state.purchaseLocation.trim() || null,
      pricePaid: state.pricePaid ? Number(state.pricePaid) : null,
      currency: state.currency.toUpperCase(),
      condition: state.condition || null,
      warrantyMonths: state.warrantyMonths ? Number(state.warrantyMonths) : null,
      receiptNumber: state.receiptNumber.trim() || null,
      receiptFile: state.receiptFile || null,
      serialNumber: state.serialNumber.trim() || null,
      context: state.context,
      groupId: state.groupId || null,
      expectedRenewalDate: state.expectedRenewalDate || null,
      trackVersions: state.trackVersions,
      modelFamily: state.modelFamily.trim() || null,
      imageUrl: state.imageUrl.trim() || null,
      notes: state.notes.trim() || null,
    };

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
      {/* Identity --------------------------------------------------------- */}
      <Section title="Identity">
        <Field label="Name" required>
          <Input
            value={state.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="MacBook Pro 16 M1 Max"
            autoFocus
          />
        </Field>
        <Field label="Brand" required>
          <div className="flex gap-2 items-center">
            <Input
              value={state.brand}
              onChange={(e) => update("brand", e.target.value)}
              placeholder="Apple"
              list="brand-suggestions"
              className="flex-1"
            />
            {brandSuggestions.length > 0 && (
              <datalist id="brand-suggestions">
                {brandSuggestions.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            )}
            {state.brand.trim() && (
              <BrandLogo brand={state.brand} size={32} />
            )}
          </div>
        </Field>
        <Field label="Category">
          <Select value={state.category} onValueChange={(v) => v && update("category", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Image URL" hint="Optional. Paste a URL to a clean product photo.">
          <Input
            value={state.imageUrl}
            onChange={(e) => update("imageUrl", e.target.value)}
            placeholder="https://..."
            type="url"
          />
        </Field>
      </Section>

      {/* Status ----------------------------------------------------------- */}
      <Section title="Status">
        <Field label="Status">
          <Select value={state.status} onValueChange={(v) => v && update("status", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Context">
          <Select value={state.context} onValueChange={(v) => v && update("context", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CONTEXTS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </Section>

      {/* Purchase -------------------------------------------------------- */}
      {!isWishlist && (
        <Section title="Purchase">
          <Field label="Condition">
            <Select value={state.condition} onValueChange={(v) => v && update("condition", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONDITIONS.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Purchase date">
            <Input
              type="date"
              value={state.purchaseDate}
              onChange={(e) => update("purchaseDate", e.target.value)}
            />
          </Field>
          <Field
            label="Purchase location"
            hint={
              resellerNames.length > 0
                ? "Suggestions from your resellers list."
                : undefined
            }
          >
            <Input
              value={state.purchaseLocation}
              onChange={(e) => update("purchaseLocation", e.target.value)}
              placeholder="Apple Store Gangnam"
              list="reseller-suggestions"
            />
            {resellerNames.length > 0 && (
              <datalist id="reseller-suggestions">
                {resellerNames.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            )}
          </Field>
          <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
            <Field label="Price paid">
              <Input
                type="number"
                inputMode="decimal"
                value={state.pricePaid}
                onChange={(e) => update("pricePaid", e.target.value)}
                placeholder="0"
                step="0.01"
                min="0"
              />
            </Field>
            <Field label="Currency">
              <Select value={state.currency} onValueChange={(v) => v && update("currency", v)}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMMON_CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Receipt number">
            <Input
              value={state.receiptNumber}
              onChange={(e) => update("receiptNumber", e.target.value)}
              placeholder="INV-12345"
            />
          </Field>
          <Field label="Serial number">
            <Input
              value={state.serialNumber}
              onChange={(e) => update("serialNumber", e.target.value)}
              placeholder="ABC123..."
              className="font-mono"
            />
          </Field>
          <Field
            label="Receipt file"
            hint="PDF, PNG, JPG or WebP. Stored locally only."
          >
            <div className="flex items-center gap-2">
              <input
                id="receipt-upload"
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleReceiptUpload(f);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() =>
                  document.getElementById("receipt-upload")?.click()
                }
              >
                {uploading ? (
                  <CircleNotch className="size-4 animate-spin" />
                ) : (
                  <UploadSimple className="size-4" />
                )}
                {state.receiptFile ? "Replace" : "Upload"}
              </Button>
              {state.receiptFile && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span className="truncate max-w-[200px]">{state.receiptFile}</span>
                  <button
                    type="button"
                    onClick={() => update("receiptFile", "")}
                    className="hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              )}
            </div>
          </Field>
        </Section>
      )}

      {/* Warranty -------------------------------------------------------- */}
      {!isWishlist && (
        <Section title="Warranty & lifecycle">
          <Field label="Warranty (months)">
            <Input
              type="number"
              inputMode="numeric"
              value={state.warrantyMonths}
              onChange={(e) => update("warrantyMonths", e.target.value)}
              placeholder="12"
              min="0"
            />
          </Field>
          <Field label="Expected renewal date" hint="When you think you'd replace it.">
            <Input
              type="date"
              value={state.expectedRenewalDate}
              onChange={(e) => update("expectedRenewalDate", e.target.value)}
            />
          </Field>
        </Section>
      )}

      {/* Grouping + notes ----------------------------------------------- */}
      <Section title="Group & notes">
        <Field label="Group">
          <Select
            value={state.groupId || "none"}
            onValueChange={(v) => update("groupId", !v || v === "none" ? "" : v)}
          >
            <SelectTrigger><SelectValue placeholder="No group" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No group</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Notes">
          <Textarea
            value={state.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={4}
            placeholder="Anything you want to remember about this device…"
          />
        </Field>
      </Section>

      {/* Version tracking ------------------------------------------------ */}
      <Section title="Version tracking">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium">Track newer releases</div>
            <div className="text-xs text-muted-foreground">
              Show on the timeline when a successor of this device is released.
            </div>
          </div>
          <Switch
            checked={state.trackVersions}
            onCheckedChange={(v) => update("trackVersions", v)}
          />
        </div>
        {state.trackVersions && (
          <Field
            label="Model family"
            hint='Wikipedia title to look up, e.g. "Sony Alpha 7" or "MacBook Pro".'
          >
            <Input
              value={state.modelFamily}
              onChange={(e) => update("modelFamily", e.target.value)}
              placeholder="Sony Alpha 7"
            />
          </Field>
        )}
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

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
