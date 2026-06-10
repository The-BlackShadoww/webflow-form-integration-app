"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await authApi.requestPasswordReset(email);
      toast.success("If that email exists, a reset link has been sent.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Request failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="rounded-2xl p-2">
      <CardHeader className="px-6 pt-4">
        <CardTitle className="font-serif text-3xl font-normal tracking-tight">Forgot password</CardTitle>
        <CardDescription className="text-[15px]">Enter your email — we'll send you a reset link.</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" size="lg" disabled={busy} className="mt-2 w-full">
            {busy && <Loader2 className="size-4 animate-spin" />} Send reset link
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">Back to sign in</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
