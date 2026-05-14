"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CircleNotch } from "@phosphor-icons/react/ssr";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

type Step = 1 | 2 | 3;

export function AddDeviceDialog({
  open,
  onOpenChange,
  initialStatus = "owned",
  groups,
  defaults,
  brandSuggestions = [],
  resellerNames = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStatus?: Device["status"];
  groups: Group[];
  defaults?: { currency?: string };
  brandSuggestions?: string[];
  resellerNames?: string[];
}) {
  const router = useRouter();
  const [state, setState] = useState<FormState>(() =>
    initialFromDevice(undefined, { ...defaults, status: initialStatus }),
  );
  const [step, setStep] = useState<Step>(1);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!open) {
      // Reset for next open so a cancelled flow doesn't leak into the next.
      setState(
        initialFromDevice(undefined, { ...defaults, status: initialStatus }),
      );
      setStep(1);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, defaults, initialStatus]);

  const isWishlist = state.status === "wishlist";
  const totalSteps = isWishlist ? 2 : 3;
  const visibleStepNumber = isWishlist && step === 3 ? 2 : step;

  const update: Updater = (key, value) => {
    setState((s) => ({ ...s, [key]: value }));
  };

  function goNext() {
    if (step === 1) {
      if (!state.name.trim() || !state.brand.trim()) {
        toast.error("Name and brand are required");
        return;
      }
      setStep(isWishlist ? 3 : 2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }
    void submit();
  }

  function goBack() {
    if (step === 3 && isWishlist) {
      setStep(1);
      return;
    }
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
  }

  async function submit() {
    if (!state.name.trim() || !state.brand.trim()) {
      toast.error("Name and brand are required");
      setStep(1);
      return;
    }
    const payload = buildPayload(state);
    startTransition(async () => {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Could not save");
        return;
      }
      const saved = (await res.json()) as Device;
      toast.success(isWishlist ? "Added to wishlist" : "Device added");
      onOpenChange(false);
      router.push(`/devices?d=${saved.id}`);
      router.refresh();
    });
  }

  async function handleReceiptUpload(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 max-h-[90vh] grid-rows-[auto_1fr_auto]">
        <DialogHeader className="p-5 pb-3">
          <DialogTitle>
            {isWishlist ? "Add to wishlist" : "Add device"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "What is it?"
              : step === 2
              ? "How did you get it?"
              : "Anything else worth tracking?"}
          </DialogDescription>
          <StepDots current={visibleStepNumber} total={totalSteps} />
        </DialogHeader>

        <div className="overflow-y-auto px-5 pb-5 space-y-3">
          {step === 1 && (
            <>
              <IdentityFields
                state={state}
                update={update}
                brandSuggestions={brandSuggestions}
              />
              <StatusFields state={state} update={update} />
            </>
          )}
          {step === 2 && !isWishlist && (
            <PurchaseFields
              state={state}
              update={update}
              resellerNames={resellerNames}
              onUploadReceipt={handleReceiptUpload}
              uploading={uploading}
            />
          )}
          {step === 3 && (
            <LifecycleFields state={state} update={update} groups={groups} />
          )}
        </div>

        <div className="flex flex-row items-center justify-between gap-2 rounded-b-xl border-t bg-muted/50 px-5 py-3">
          <Button
            type="button"
            variant="ghost"
            onClick={goBack}
            disabled={step === 1}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div className="text-xs text-muted-foreground tabular-nums">
            Step {visibleStepNumber} of {totalSteps}
          </div>
          <Button type="button" onClick={goNext} disabled={pending}>
            {pending && <CircleNotch className="size-4 animate-spin" />}
            {visibleStepNumber === totalSteps ? (
              isWishlist ? "Add to wishlist" : "Add device"
            ) : (
              <>
                Next
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 mt-2">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1 rounded-full transition-all",
            i + 1 === current
              ? "w-6 bg-foreground"
              : i + 1 < current
              ? "w-3 bg-foreground/60"
              : "w-3 bg-border",
          )}
        />
      ))}
    </div>
  );
}
