"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const qc = useQueryClient();
  const meQ = useQuery({ queryKey: ["me"], queryFn: async () => (await authApi.me()).data.user });
  const [name, setName] = useState("");
  useEffect(() => { if (meQ.data?.name) setName(meQ.data.name); }, [meQ.data]);

  const save = useMutation({
    mutationFn: () => authApi.updateMe({ name }),
    onSuccess: () => { toast.success("Profile updated."); qc.invalidateQueries({ queryKey: ["me"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Save failed"),
  });

  if (meQ.isLoading) return <Loader2 className="size-5 animate-spin text-muted-foreground" />;
  return (
    <div className="space-y-4 max-w-md">
      <div>
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label>Email</Label>
        <Input value={meQ.data?.email ?? ""} readOnly disabled className="mt-1" />
      </div>
      <Button size="sm" onClick={() => save.mutate()} disabled={!name.trim() || save.isPending}>
        {save.isPending && <Loader2 className="size-3.5 animate-spin" />} Save
      </Button>
    </div>
  );
}
