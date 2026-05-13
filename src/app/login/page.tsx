import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login/login-form";
import { COOKIE_NAME, authEnabled, verifySession } from "@/lib/auth";

export const metadata = {
  title: "Sign in · GearUp",
};

export default async function LoginPage() {
  // If you're already signed in, skip the form entirely.
  if (authEnabled()) {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (token && (await verifySession(token))) {
      redirect("/");
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex size-10 items-center justify-center rounded-xl bg-foreground text-background text-sm font-semibold mx-auto">
            G
          </div>
          <h1 className="text-xl font-semibold tracking-tight">GearUp</h1>
          <p className="text-sm text-muted-foreground">
            Enter your password to continue.
          </p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
