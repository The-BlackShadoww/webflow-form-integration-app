"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error("Missing or expired token");
    if (newPw.length < 8) return toast.error("Password must be at least 8 characters");
    if (newPw !== confirm) return toast.error("Passwords do not match");
    setBusy(true);
    try {
      await authApi.confirmPasswordReset(token, newPw);
      toast.success("Password reset — sign in with your new password.");
      router.replace("/sign-in");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="rounded-2xl p-2">
      <CardHeader className="px-6 pt-4">
        <CardTitle className="font-serif text-3xl font-normal tracking-tight">Reset password</CardTitle>
        <CardDescription className="text-[15px]">Set a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <form onSubmit={submit} className="grid gap-4">
          {!token && <p className="text-sm text-destructive">This link is invalid or expired.</p>}
          <div className="grid gap-2">
            <Label htmlFor="newpw">New password</Label>
            <Input id="newpw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <Button type="submit" size="lg" disabled={busy || !token} className="mt-2 w-full">
            {busy && <Loader2 className="size-4 animate-spin" />} Update password
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">Back to sign in</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={null}><ResetPasswordForm /></Suspense>;
}
