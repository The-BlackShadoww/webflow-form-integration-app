"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, ScrollText } from "lucide-react";
import { dashboardApi } from "@/lib/api";
import { providers } from "@/features/integrations/providers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS: Record<string, string> = {
  success: "bg-green-500/15 text-green-600",
  pending: "bg-amber-500/15 text-amber-600",
  failed: "bg-red-500/15 text-red-600",
  received: "bg-blue-500/15 text-blue-600",
};

const providerByEnum = new Map(providers.map((p) => [p.typeEnum, p.name]));

function providerLabel(integrationType: string): string {
  if (integrationType === "_inbound") return "Webflow";
  return providerByEnum.get(integrationType) ?? integrationType;
}

function direction(integrationType: string): "Inbound" | "Outbound" {
  return integrationType === "_inbound" ? "Inbound" : "Outbound";
}

export default function SiteLogsPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const [status, setStatus] = useState<string>("");
  const { data, isLoading } = useQuery({
    queryKey: ["logs", siteId, status],
    queryFn: async () => (await dashboardApi.logs({ siteId, status: status || undefined })).data.logs,
    refetchInterval: 10_000,
    enabled: !!siteId,
  });

  const logs = data ?? [];

  return (
    <>
      <div className="mb-2">
        <Link href={`/sites/${siteId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Back to site
        </Link>
      </div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl font-normal tracking-tight text-foreground">Logs</h1>
          <p className="mt-1 text-sm text-muted-foreground font-mono">{siteId}</p>
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-full border border-[var(--input)] bg-card px-3 text-sm"
        >
          <option value="">All statuses</option>
          <option value="received">received</option>
          <option value="pending">pending</option>
          <option value="success">success</option>
          <option value="failed">failed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : logs.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <ScrollText className="size-10 text-muted-foreground" />
            <p className="font-serif text-2xl font-normal tracking-tight">No logs yet</p>
            <p className="text-muted-foreground text-sm">Submit a form on your Webflow site to see events here.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="p-0">
            <div className="divide-y divide-border text-sm">
              <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <div className="col-span-2">Time</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Provider</div>
                <div className="col-span-2">Direction</div>
                <div className="col-span-4">Message</div>
              </div>
              {logs.map((l) => {
                const dir = direction(l.integrationType);
                return (
                  <div key={l.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-start">
                    <div className="col-span-2 text-muted-foreground text-xs">{new Date(l.createdAt).toLocaleString()}</div>
                    <div className="col-span-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[l.status] ?? "bg-muted text-foreground"}`}>{l.status}</span>
                    </div>
                    <div className="col-span-2 text-xs text-foreground">{providerLabel(l.integrationType)}</div>
                    <div className="col-span-2">
                      <Badge variant="outline" className="rounded-full border-border bg-canvas-soft text-[10px] uppercase tracking-wider text-muted-foreground">
                        {dir}
                      </Badge>
                    </div>
                    <div className="col-span-4 text-xs text-muted-foreground break-words">{l.message || ""}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
