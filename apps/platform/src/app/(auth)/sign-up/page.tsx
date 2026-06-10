"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUpPage() {
  const router = useRouter();
  const { setSession } = useAuthStore();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8)
      return toast.error("Password must be at least 8 characters");
    setBusy(true);
    try {
      const { data } = await authApi.signup(email, password, name);
      qc.clear();
      setSession(data.user, data.token);
      toast.success(`Welcome, ${data.user.email}!`);
      router.replace("/sites");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Sign up failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="rounded-2xl p-2">
      <CardHeader className="px-6 pt-4">
        <CardTitle className="font-serif text-3xl font-normal tracking-tight">
          Create account
        </CardTitle>
        <CardDescription className="text-[15px]">
          Start integrating Webflow forms with your favorite tools.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-muted-foreground text-xs">
              At least 8 characters.
            </p>
          </div>
          <Button
            type="submit"
            size="lg"
            disabled={busy}
            className="mt-2 w-full"
          >
            {busy && <Loader2 className="size-4 animate-spin" />} Create account
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have one?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
