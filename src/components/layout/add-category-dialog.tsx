"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CircleNotch, Plus } from "@phosphor-icons/react/ssr";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TONES, dotClass, iconUrl, type Tone } from "@/lib/categories";
import { cn } from "@/lib/utils";

type Suggestion = { slug: string; title: string };

export function AddCategoryDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [tone, setTone] = useState<Tone>("blue");
  const [iconSlug, setIconSlug] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [pending, setPending] = useState(false);
  const seq = useRef(0);

  // Debounced thiings search whenever the label changes.
  useEffect(() => {
    if (!open) return;
    const term = label.trim();
    /* eslint-disable react-hooks/set-state-in-effect */
    if (term.length < 2) {
      setSuggestions([]);
      setIconSlug(null);
      return;
    }
    const me = ++seq.current;
    setSearching(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/thiings/search?q=${encodeURIComponent(term)}&limit=8`,
        );
        if (!res.ok) {
          if (seq.current === me) setSuggestions([]);
          return;
        }
        const data = (await res.json()) as { icons: Suggestion[] };
        if (seq.current !== me) return;
        setSuggestions(data.icons);
        // Auto-pick the first hit unless the user has already chosen one
        // that's still in the result set.
        setIconSlug((current) => {
          if (current && data.icons.some((i) => i.slug === current)) return current;
          return data.icons[0]?.slug ?? null;
        });
      } finally {
        if (seq.current === me) setSearching(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [label, open]);

  // Reset when reopening
  useEffect(() => {
    if (!open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setLabel("");
      setTone("blue");
      setIconSlug(null);
      setSuggestions([]);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) {
      toast.error("Name is required");
      return;
    }
    setPending(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim(), tone, iconSlug }),
    });
    setPending(false);
    if (!res.ok) {
      toast.error("Could not create category");
      return;
    }
    toast.success("Category added");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label="Add category"
        className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
      >
        <Plus className="size-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New category</DialogTitle>
          <DialogDescription>
            Add a custom category. We suggest an icon from thiings as you type.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Drone, e-bike, smart home…"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Icon</Label>
              {searching && (
                <CircleNotch className="size-3.5 animate-spin text-muted-foreground" />
              )}
            </div>
            {suggestions.length > 0 ? (
              <div className="grid grid-cols-8 gap-2">
                {suggestions.map((s) => {
                  const selected = s.slug === iconSlug;
                  return (
                    <button
                      key={s.slug}
                      type="button"
                      onClick={() => setIconSlug(s.slug)}
                      title={s.title}
                      className={cn(
                        "aspect-square rounded-md border p-1 transition-all bg-card",
                        selected
                          ? "border-foreground ring-2 ring-foreground/20"
                          : "border-border hover:border-foreground/40",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={iconUrl(s.slug, 128)!}
                        alt={s.title}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                {label.trim().length < 2
                  ? "Type a name to find a matching icon."
                  : searching
                  ? "Searching…"
                  : "No matching icons — your category will use the color dot."}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-7 gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-label={t}
                  onClick={() => setTone(t)}
                  className={cn(
                    "size-7 rounded-full ring-offset-background transition-all",
                    dotClass(t),
                    tone === t
                      ? "ring-2 ring-foreground/40 ring-offset-2 scale-110"
                      : "hover:scale-110",
                  )}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <CircleNotch className="size-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
