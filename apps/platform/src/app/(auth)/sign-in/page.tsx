"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SignInForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirectTo = sp.get("redirect") ?? "/sites";
  const { setSession } = useAuthStore();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await authApi.login(email, password);
      qc.clear();
      setSession(data.user, data.token);
      toast.success(`Welcome back, ${data.user.email}!`);
      router.replace(redirectTo);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="rounded-2xl p-2">
      <CardHeader className="px-6 pt-4">
        <CardTitle className="font-serif text-3xl font-normal tracking-tight">Sign in</CardTitle>
        <CardDescription className="text-[15px]">Welcome back. Enter your email and password to continue.</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password" className="flex items-center justify-between">
              Password
              <Link href="/forgot-password" className="text-xs text-muted-foreground hover:underline">Forgot?</Link>
            </Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" size="lg" disabled={busy} className="mt-2 w-full">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />} Sign in
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            No account? <Link href="/sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">Sign up</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default function SignInPage() {
  return <Suspense fallback={null}><SignInForm /></Suspense>;
}
