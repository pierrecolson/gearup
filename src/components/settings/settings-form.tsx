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
import {
  DATE_FORMATS,
  OPENROUTER_MODEL_SUGGESTIONS,
  type DateFormat,
  type Settings,
} from "@/lib/types";

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [displayCurrency, setDisplayCurrency] = useState(initial.displayCurrency);
  const [defaultInputCurrency, setDefaultInputCurrency] = useState(
    initial.defaultInputCurrency,
  );
  const [dateFormat, setDateFormat] = useState(initial.dateFormat);
  const [openRouterModel, setOpenRouterModel] = useState(
    initial.openRouterModel ?? "",
  );
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
          // Empty string → null so the lookup falls back to env var / default.
          openRouterModel: openRouterModel.trim() || null,
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
        <Select
          value={dateFormat}
          onValueChange={(v) => v && setDateFormat(v as DateFormat)}
        >
          <SelectTrigger className="w-64">
            <SelectValue>
              {(value: unknown) => {
                const found = DATE_FORMATS.find((f) => f.value === value);
                return found ? `${found.label} (${found.example})` : "";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {DATE_FORMATS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label} ({f.example})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          How dates render across the app — on cards, panels, and timelines.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>AI model (OpenRouter)</Label>
        <Input
          value={openRouterModel}
          onChange={(e) => setOpenRouterModel(e.target.value)}
          placeholder="openai/gpt-5-mini"
          list="openrouter-models"
          className="w-80 font-mono text-sm"
        />
        <datalist id="openrouter-models">
          {OPENROUTER_MODEL_SUGGESTIONS.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <p className="text-xs text-muted-foreground">
          Used for version-release lookups in device timelines. Leave blank
          to use the <code>OPENROUTER_MODEL</code> env var, or the built-in
          default (<code>openai/gpt-5-mini</code>). Type any OpenRouter slug;
          the dropdown is just suggestions.
        </p>
      </div>

      <Button type="submit" disabled={pending}>
        {pending && <CircleNotch className="size-4 animate-spin" />}
        Save settings
      </Button>
    </form>
  );
}
