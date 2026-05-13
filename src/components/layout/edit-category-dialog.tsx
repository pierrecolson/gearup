"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CircleNotch, Pencil } from "@phosphor-icons/react/ssr";
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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  TONES,
  dotClass,
  iconUrl,
  type CategoryDef,
  type Tone,
} from "@/lib/categories";
import { cn } from "@/lib/utils";

type Suggestion = { slug: string; title: string };

export function EditCategoryDialog({ category }: { category: CategoryDef }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(category.label);
  const [tone, setTone] = useState<Tone>(category.tone);
  const [iconSlug, setIconSlug] = useState<string | null>(category.iconSlug);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [pending, setPending] = useState(false);
  const seq = useRef(0);

  // Re-seed local state every time the dialog opens, so subsequent edits show
  // the current saved values (router.refresh may have changed them).
  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setLabel(category.label);
      setTone(category.tone);
      setIconSlug(category.iconSlug);
      setSuggestions([]);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open, category.label, category.tone, category.iconSlug]);

  // Debounced icon search
  useEffect(() => {
    if (!open) return;
    const term = label.trim();
    /* eslint-disable react-hooks/set-state-in-effect */
    if (term.length < 2) {
      setSuggestions([]);
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
      } finally {
        if (seq.current === me) setSearching(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [label, open]);

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
      body: JSON.stringify({
        id: category.id, // keep id stable — important so existing devices keep their reference
        label: label.trim(),
        tone,
        iconSlug,
      }),
    });
    setPending(false);
    if (!res.ok) {
      toast.error("Could not save");
      return;
    }
    toast.success("Category updated");
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label={`Edit ${category.label}`}
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <Pencil className="size-4" />
        Edit
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit category</DialogTitle>
          <DialogDescription>
            Rename, change the color, or pick a different icon. The id stays
            the same — your devices stay linked.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
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
            {iconSlug && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-md border border-border bg-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={iconUrl(iconSlug, 128)!}
                  alt=""
                  className="size-8 object-contain"
                />
                <span className="text-sm flex-1 truncate">{iconSlug}</span>
                <button
                  type="button"
                  onClick={() => setIconSlug(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            )}
            {suggestions.length > 0 && (
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
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
