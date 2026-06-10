"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AccountPage() {
  const router = useRouter();
  const { reset } = useAuthStore();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const change = useMutation({
    mutationFn: () => authApi.changePassword({ currentPassword: current, newPassword: next }),
    onSuccess: () => { toast.success("Password updated."); setCurrent(""); setNext(""); setConfirm(""); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Change failed"),
  });

  const del = useMutation({
    mutationFn: () => authApi.deleteMe(),
    onSuccess: () => { reset(); router.replace("/sign-in"); toast.success("Account deleted."); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Delete failed"),
  });

  const canSubmit = current && next.length >= 8 && next === confirm;

  return (
    <div className="space-y-8 max-w-md">
      <div className="space-y-4">
        <div>
          <Label>Current password</Label>
          <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>New password</Label>
          <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} className="mt-1" />
          <p className="text-muted-foreground text-xs mt-1">At least 8 characters.</p>
        </div>
        <div>
          <Label>Confirm new password</Label>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1" />
        </div>
        <Button size="sm" onClick={() => change.mutate()} disabled={!canSubmit || change.isPending}>
          {change.isPending && <Loader2 className="size-3.5 animate-spin" />} Update password
        </Button>
      </div>

      <div className="border-t pt-6 space-y-3">
        <h3 className="text-sm font-semibold text-red-600">Danger zone</h3>
        <p className="text-muted-foreground text-xs">Permanently delete your account and all data linked to it.</p>
        <Button size="sm" variant="destructive" disabled={del.isPending}
          onClick={() => { if (window.confirm("Delete your account permanently?")) del.mutate(); }}>
          {del.isPending && <Loader2 className="size-3.5 animate-spin" />} Delete account
        </Button>
      </div>
    </div>
  );
}
