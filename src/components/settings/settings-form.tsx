"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CircleNotch } from "@phosphor-icons/react/ssr";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COMMON_CURRENCIES } from "@/lib/currency-format";
import type { Settings } from "@/lib/types";

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [displayCurrency, setDisplayCurrency] = useState(initial.displayCurrency);
  const [defaultInputCurrency, setDefaultInputCurrency] = useState(
    initial.defaultInputCurrency,
  );
  const [dateFormat, setDateFormat] = useState(initial.dateFormat);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayCurrency,
          defaultInputCurrency,
          dateFormat,
        }),
      });
      if (!res.ok) {
        toast.error("Could not save");
        return;
      }
      toast.success("Settings saved");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <Label>Display currency</Label>
        <Select value={displayCurrency} onValueChange={(v) => v && setDisplayCurrency(v)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMMON_CURRENCIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          What the dashboard totals and stat charts render in. Changing this
          only affects today&apos;s-value views — frozen at-purchase snapshots
          keep the currency they were saved with.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Default input currency</Label>
        <Select value={defaultInputCurrency} onValueChange={(v) => v && setDefaultInputCurrency(v)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COMMON_CURRENCIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Pre-filled on every new device form. Can be overridden per device.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Date format</Label>
        <Input
          value={dateFormat}
          onChange={(e) => setDateFormat(e.target.value)}
          className="w-48 font-mono text-sm"
          placeholder="yyyy-MM-dd"
        />
        <p className="text-xs text-muted-foreground">
          date-fns format tokens. Reserved for future use — most surfaces
          currently use &ldquo;MMM yyyy&rdquo;.
        </p>
      </div>

      <Button type="submit" disabled={pending}>
        {pending && <CircleNotch className="size-4 animate-spin" />}
        Save settings
      </Button>
    </form>
  );
}
