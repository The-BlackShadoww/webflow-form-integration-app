"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plug } from "lucide-react";
import { dashboardApi } from "@/lib/api";
import { providers, type Provider } from "@/features/integrations/providers";
import { ConnectionDialog } from "@/features/integrations/connection-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function IntegrationsPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const [selected, setSelected] = useState<Provider | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["credentials"],
    queryFn: async () => (await dashboardApi.credentials()).data.credentials,
  });

  const creds = data ?? [];
  const credsByType = new Map<string, any[]>();
  creds.forEach((c: any) => {
    const k = String(c.type).toLowerCase();
    const arr = credsByType.get(k) ?? [];
    arr.push(c);
    credsByType.set(k, arr);
  });

  return (
    <>
      <div className="mb-2">
        <Link
          href={`/sites/${siteId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to site
        </Link>
      </div>
      <div className="mb-6">
        <h1 className="font-serif text-4xl font-normal tracking-tight text-foreground">
          Integrations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground font-mono">{siteId}</p>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {providers.map((p) => {
            const enabled = p.enabled ?? false;
            const list = credsByType.get(p.typeEnum.toLowerCase()) ?? [];
            const hasConnections = list.length > 0;
            return (
              <Card
                key={p.slug}
                className={
                  enabled
                    ? "cursor-pointer transition hover:border-foreground/30"
                    : "opacity-50"
                }
                onClick={() => enabled && setSelected(p)}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <Plug className="mt-0.5 size-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{p.name}</p>
                      {!enabled && (
                        <Badge variant="secondary" className="text-[10px]">
                          Soon
                        </Badge>
                      )}
                      {hasConnections && (
                        <Badge className="bg-emerald-500/15 text-emerald-600 text-[10px]">
                          {list.length} connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {p.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ConnectionDialog
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
        presetProvider={selected}
      />
    </>
  );
}
