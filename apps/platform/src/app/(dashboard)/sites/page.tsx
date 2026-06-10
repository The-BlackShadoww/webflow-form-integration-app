"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Globe, Loader2, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { dashboardApi, type DashboardSite } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { providers } from "@/features/integrations/providers";

const typeToName = providers.reduce<Record<string, string>>((acc, p) => {
  acc[p.typeEnum] = p.name;
  return acc;
}, {});

export default function SitesPage() {
  const sp = useSearchParams();
  const connected = sp.get("connected");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => (await dashboardApi.sites()).data.sites,
  });

  useEffect(() => {
    if (connected === "true") {
      toast.success("Webflow connected — sites synced.");
      void refetch();
      const url = new URL(window.location.href);
      url.searchParams.delete("connected");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [connected, refetch]);

  const sites = data ?? [];
  const totalIntegrations = sites.reduce((sum, s) => sum + (s.integrations?.length ?? 0), 0);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink">Connected sites</h1>
          <p className="mt-1 text-sm text-mute">
            {sites.length} {sites.length === 1 ? "site" : "sites"} · {totalIntegrations} {totalIntegrations === 1 ? "integration" : "integrations"} active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SyncButton onDone={() => void refetch()} />
          <Button onClick={() => (window.location.href = dashboardApi.connectWebflowUrl())}>
            <Plus className="size-4" /> Add site
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-mute" />
        </div>
      ) : sites.length === 0 ? (
        <Card className="rounded-lg">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Globe className="size-10 text-mute" />
            <p className="font-display text-2xl font-bold tracking-tight text-ink">No sites yet</p>
            <p className="text-sm text-charcoal">Connect your Webflow account to import sites.</p>
            <Button onClick={() => (window.location.href = dashboardApi.connectWebflowUrl())}>
              <Plus className="size-4" /> Connect Webflow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sites.map((s) => <SiteCard key={s.id} site={s} />)}
        </div>
      )}
    </>
  );
}

function SyncButton({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const { data } = await dashboardApi.syncSites();
          toast.success(`Synced — ${data.synced} site(s)`);
          onDone();
        } catch (e: any) {
          toast.error(e?.response?.data?.message ?? "Sync failed");
        } finally {
          setBusy(false);
        }
      }}
    >
      <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} /> Sync
    </Button>
  );
}

function SiteCard({ site }: { site: DashboardSite }) {
  const ints = site.integrations ?? [];
  return (
    <Link
      href={`/sites/${site.siteId}`}
      className="group block rounded-md border border-hairline bg-surface-card p-5 transition hover:border-hairline-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{site.displayName}</p>
          <p className="mt-0.5 truncate font-mono text-xs text-ash">{site.siteId}</p>
        </div>
        <CheckCircle2 className={`size-4 shrink-0 ${ints.length ? "text-badge-success" : "text-stone"}`} />
      </div>

      <div className="mt-4 min-h-7 flex flex-wrap gap-1.5">
        {ints.length === 0 ? (
          <span className="text-xs text-mute">No integrations yet</span>
        ) : (
          ints.map((t) => (
            <Badge key={t} variant="outline" className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              {typeToName[t] ?? t}
            </Badge>
          ))
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-hairline pt-4 text-sm">
        <span className="text-charcoal">Manage integrations</span>
        <ArrowRight className="size-4 text-charcoal transition group-hover:translate-x-0.5 group-hover:text-ink" />
      </div>
    </Link>
  );
}
