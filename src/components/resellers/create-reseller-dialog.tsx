"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button, buttonVariants } from "@/components/ui/button";
import { ResellerLogo } from "./reseller-logo";

export function CreateResellerDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      toast.error("Name and URL required");
      return;
    }
    setPending(true);
    const normalizedUrl = /^https?:\/\//.test(url.trim())
      ? url.trim()
      : `https://${url.trim()}`;
    const res = await fetch("/api/resellers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        url: normalizedUrl,
        notes: notes.trim() || null,
      }),
    });
    setPending(false);
    if (!res.ok) {
      toast.error("Could not create");
      return;
    }
    toast.success("Reseller added");
    setName("");
    setUrl("");
    setNotes("");
    setOpen(false);
    router.refresh();
  }

  const showPreview = url.trim().length > 3;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants()}>
        <Plus className="size-4" />
        Add reseller
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New reseller</DialogTitle>
          <DialogDescription>
            A shop or seller you bought from. Logos are pulled from logo.dev
            then Google&apos;s favicon service.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Coupang"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>Website</Label>
            <div className="flex items-center gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="coupang.com"
                className="flex-1"
              />
              {showPreview && (
                <ResellerLogo
                  url={
                    /^https?:\/\//.test(url.trim()) ? url.trim() : `https://${url.trim()}`
                  }
                  name={name || url}
                  size={36}
                />
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional. Anything to remember about this shop."
            />
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
