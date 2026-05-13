"use client";

import { useState } from "react";
import { SignOut, CircleNotch } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [pending, setPending] = useState(false);
  async function handle() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    // Hard navigate so middleware re-evaluates against the cleared cookie.
    window.location.href = "/login";
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handle}
      disabled={pending}
      aria-label="Sign out"
      className="text-muted-foreground hover:text-foreground"
    >
      {pending ? (
        <CircleNotch className="size-4 animate-spin" />
      ) : (
        <SignOut className="size-4" />
      )}
    </Button>
  );
}
