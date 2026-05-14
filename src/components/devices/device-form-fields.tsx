"use client";

import * as React from "react";
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
import { DatePicker } from "@/components/ui/date-picker";
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

export type FormState = {
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

export function initialFromDevice(
  device?: Device,
  defaults?: Partial<FormState>,
): FormState {
  return {
    name: device?.name ?? "",
    brand: device?.brand ?? "",
    category: device?.category ?? "laptop",
    status: device?.status ?? defaults?.status ?? "owned",
    purchaseDate: device?.purchaseDate ?? "",
    purchaseLocation: device?.purchaseLocation ?? "",
    pricePaid:
      device?.pricePaid !== null && device?.pricePaid !== undefined
        ? String(device.pricePaid)
        : "",
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

export function buildPayload(state: FormState) {
  return {
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
}

export type Updater = <K extends keyof FormState>(
  key: K,
  value: FormState[K],
) => void;

type FieldsProps = {
  state: FormState;
  update: Updater;
};

export function IdentityFields({
  state,
  update,
  brandSuggestions = [],
}: FieldsProps & { brandSuggestions?: string[] }) {
  const categories = useCategories();
  return (
    <>
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
          {state.brand.trim() && <BrandLogo brand={state.brand} size={32} />}
        </div>
      </Field>
      <Field label="Category">
        <Select
          value={state.category}
          onValueChange={(v) => v && update("category", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
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
    </>
  );
}

export function StatusFields({ state, update }: FieldsProps) {
  return (
    <>
      <Field label="Status">
        <Select
          value={state.status}
          onValueChange={(v) => v && update("status", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Context">
        <Select
          value={state.context}
          onValueChange={(v) => v && update("context", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONTEXTS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </>
  );
}

export function PurchaseFields({
  state,
  update,
  resellerNames = [],
  onUploadReceipt,
  uploading,
}: FieldsProps & {
  resellerNames?: string[];
  onUploadReceipt: (file: File) => void;
  uploading: boolean;
}) {
  return (
    <>
      <Field label="Condition">
        <Select
          value={state.condition}
          onValueChange={(v) => v && update("condition", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONDITIONS.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Purchase date">
        <DatePicker
          value={state.purchaseDate || null}
          onChange={(v) => update("purchaseDate", v ?? "")}
          placeholder="Pick the day you bought it"
          precisions={["day", "month"]}
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
      <Field label="Price paid">
        <div className="flex gap-2">
          <Input
            type="number"
            inputMode="decimal"
            value={state.pricePaid}
            onChange={(e) => update("pricePaid", e.target.value)}
            placeholder="0"
            step="0.01"
            min="0"
            className="flex-1"
          />
          <Select
            value={state.currency}
            onValueChange={(v) => v && update("currency", v)}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COMMON_CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Field>
      <Field label="Warranty (months)">
        <WarrantyMonthsInput
          value={state.warrantyMonths}
          onChange={(v) => update("warrantyMonths", v)}
        />
      </Field>
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
              if (f) onUploadReceipt(f);
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
              <span className="truncate max-w-[200px]">
                {state.receiptFile}
              </span>
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
    </>
  );
}

export function LifecycleFields({
  state,
  update,
  groups,
}: FieldsProps & { groups: Group[] }) {
  return (
    <>
      <Field
        label="Expected renewal date"
        optional
        hint="When you think you'd replace it. Leave blank if you don't know yet."
      >
        <DatePicker
          value={state.expectedRenewalDate || null}
          onChange={(v) => update("expectedRenewalDate", v ?? "")}
          placeholder="No renewal target"
          precisions={["day", "month", "year"]}
        />
      </Field>
      <Field label="Group">
        <Select
          value={state.groupId || "none"}
          onValueChange={(v) => update("groupId", !v || v === "none" ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="No group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No group</SelectItem>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name}
              </SelectItem>
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
      <div className="flex items-center justify-between gap-4 pt-2">
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
          hint='Used to look up newer releases, e.g. "MacBook Pro 14" or "iPhone Pro Max".'
        >
          <Input
            value={state.modelFamily}
            onChange={(e) => update("modelFamily", e.target.value)}
            placeholder="MacBook Pro 14"
          />
        </Field>
      )}
    </>
  );
}

const WARRANTY_PRESETS = ["6", "12", "24", "36", "48"] as const;

function WarrantyMonthsInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const isPreset = (WARRANTY_PRESETS as readonly string[]).includes(value);
  const [custom, setCustom] = React.useState(value === "" || isPreset ? false : true);
  const select = value === "" ? "" : custom ? "custom" : value;

  return (
    <div className="flex gap-2">
      <Select
        value={select}
        onValueChange={(v) => {
          if (!v) return;
          if (v === "custom") {
            setCustom(true);
            return;
          }
          setCustom(false);
          onChange(v);
        }}
      >
        <SelectTrigger className={custom ? "w-28" : "flex-1"}>
          <SelectValue placeholder="Pick a duration" />
        </SelectTrigger>
        <SelectContent>
          {WARRANTY_PRESETS.map((m) => (
            <SelectItem key={m} value={m}>
              {m} months
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom…</SelectItem>
        </SelectContent>
      </Select>
      {custom && (
        <Input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Months"
          min="0"
          className="flex-1"
          autoFocus
        />
      )}
    </div>
  );
}

export function Field({
  label,
  hint,
  required,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
        {optional && (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            (optional)
          </span>
        )}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
