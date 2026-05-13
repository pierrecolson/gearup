"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DotsThree, Pencil, Trash, CircleNotch } from "@phosphor-icons/react/ssr";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";

export function DeviceActionsMenu({
  deviceId,
  deviceName,
}: {
  deviceId: string;
  deviceName: string;
}) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    const res = await fetch(`/api/devices/${deviceId}`, { method: "DELETE" });
    setPending(false);
    if (!res.ok) {
      toast.error("Could not delete");
      return;
    }
    toast.success("Device deleted");
    setConfirmOpen(false);
    // Close the panel by stripping ?d
    router.push(window.location.pathname);
    router.refresh();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="More actions"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <DotsThree weight="bold" className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={() => router.push(`/devices/${deviceId}?edit=1`)}
          >
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{deviceName}&rdquo;?</DialogTitle>
            <DialogDescription>
              Permanently removes the device from your cockpit. Receipt files
              stay on disk.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={handleDelete}
            >
              {pending && <CircleNotch className="size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
