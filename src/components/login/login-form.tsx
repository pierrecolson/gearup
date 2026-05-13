"use client";

import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { CircleNotch } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // Hard navigate so the new cookie is picked up on the very next request.
        window.location.href = nextPath;
        return;
      }
      if (res.status === 429) {
        setError("Too many attempts. Wait a minute, then try again.");
      } else if (res.status === 503) {
        setError("Auth isn't configured on this server.");
      } else {
        setError("Wrong password.");
      }
    });
    // Discard the value either way — never sits in DOM longer than needed.
    setPassword("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border/60 bg-card p-6 shadow-sm"
    >
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          autoFocus
          required
        />
      </div>
      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={pending || !password}>
        {pending && <CircleNotch className="size-4 animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}
