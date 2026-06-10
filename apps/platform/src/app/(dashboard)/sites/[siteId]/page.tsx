"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, FileText, KeyRound, Loader2, Pencil, Plus, Unplug } from "lucide-react";
import { toast } from "sonner";
import { dashboardApi } from "@/lib/api";
import { providers } from "@/features/integrations/providers";
import { AddMappingDialog, type EditingMapping } from "@/features/integrations/add-mapping-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type FormCard = {
  id: string;
  formElementId: string | null;
  displayName: string;
  pageName: string;
  pageId: string;
  pageUrl: string | null;
  designerUrl: string | null;
  duplicateCount: number;
  fields: Array<{ id: string; displayName: string }>;
};

export default function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const qc = useQueryClient();
  const [addFor, setAddFor] = useState<FormCard | null>(null);
  const [editing, setEditing] = useState<EditingMapping | null>(null);

  const sitesQ = useQuery({ queryKey: ["sites"], queryFn: async () => (await dashboardApi.sites()).data.sites });
  const formsQ = useQuery({ queryKey: ["forms", siteId], queryFn: async () => (await dashboardApi.forms(siteId)).data });
  const licenseQ = useQuery({ queryKey: ["license", siteId], queryFn: async () => (await dashboardApi.siteLicense(siteId)).data });
  const integrationsQ = useQuery({ queryKey: ["integrations", siteId], queryFn: async () => (await dashboardApi.integrations(siteId)).data.integrations });
  const healthQ = useQuery({ queryKey: ["webhook-health", siteId], queryFn: async () => (await dashboardApi.webhookHealth(siteId)).data });

  const del = useMutation({
    mutationFn: (id: number) => dashboardApi.deleteMapping(id),
    onSuccess: () => {
      toast.success("Disconnected.");
      qc.invalidateQueries({ queryKey: ["integrations", siteId] });
    },
  });

  const site = sitesQ.data?.find((s) => s.siteId === siteId);
  const forms = formsQ.data?.forms ?? [];
  const needsReconnect = formsQ.data?.needsReconnect ?? false;
  const integrations = integrationsQ.data ?? [];
  const mappingByForm = new Map<string, any>();
  const mappingByElementId = new Map<string, any>();
  integrations.forEach((i: any) => {
    mappingByForm.set(i.formId, i);
    if (i.formElementId) mappingByElementId.set(i.formElementId, i);
  });
  const providerByType = new Map(providers.map((p) => [p.typeEnum.toLowerCase(), p]));
  const licensed = licenseQ.data?.licensed ?? false;

  // Dedupe forms by formElementId — Webflow returns duplicate rows when the
  // same form (Component/Symbol) is reused on multiple pages. They share the
  // same formElementId. We collapse them into one card; webhooks fall back to
  // matching by (siteId, formElementId) so any duplicate dispatches.
  const cards: FormCard[] = (() => {
    const groups = new Map<string, any[]>();
    const standalone: FormCard[] = [];
    forms.forEach((f: any) => {
      if (f.formElementId) {
        const arr = groups.get(f.formElementId) ?? [];
        arr.push(f); groups.set(f.formElementId, arr);
      }
    });
    for (const arr of groups.values()) {
      // Webflow returns one form-entry per page the form lives on. When the same form
      // is embedded under a folder index AND on a real page, prefer the entry whose
      // pageUrl path is deepest so the "Live" link goes to the actual published page.
      const f = [...arr].sort((a: any, b: any) => {
        const pa = String(a.pageUrl ?? "").split("/").filter(Boolean).length;
        const pb = String(b.pageUrl ?? "").split("/").filter(Boolean).length;
        return pb - pa;
      })[0];
      const fieldsObj = (f.fields ?? {}) as Record<string, { displayName: string }>;
      standalone.push({
        id: f.id,
        formElementId: f.formElementId,
        displayName: f.displayName,
        pageName: arr.length > 1 ? `${arr.length} pages` : (f.pageName ?? "—"),
        pageId: f.pageId ?? "",
        pageUrl: f.pageUrl ?? null,
        designerUrl: f.designerUrl ?? null,
        duplicateCount: arr.length,
        fields: Object.entries(fieldsObj).map(([id, v]) => ({ id, displayName: v.displayName })),
      });
    }
    // Forms without a formElementId (rare) — keep as-is
    forms.filter((f: any) => !f.formElementId).forEach((f: any) => {
      const fieldsObj = (f.fields ?? {}) as Record<string, { displayName: string }>;
      standalone.push({
        id: f.id, formElementId: null, displayName: f.displayName,
        pageName: f.pageName ?? "—", pageId: f.pageId ?? "", pageUrl: f.pageUrl ?? null, designerUrl: f.designerUrl ?? null, duplicateCount: 1,
        fields: Object.entries(fieldsObj).map(([id, v]) => ({ id, displayName: v.displayName })),
      });
    });
    return standalone;
  })();

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/sites"><ArrowLeft className="size-4" /> Sites</Link>
        </Button>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{site?.displayName ?? "Site"}</h1>
          <p className="text-muted-foreground text-sm">Map each form to one integration.</p>
        </div>
        {healthQ.data && (
          healthQ.data.ok
            ? <Badge variant="secondary" className="text-xs">Webhook ✓</Badge>
            : <button
                className="text-xs rounded bg-red-500/15 text-red-600 px-2 py-0.5 hover:bg-red-500/25"
                onClick={async () => {
                  try {
                    await dashboardApi.repairWebhook(siteId);
                    toast.success("Webhook re-registered");
                    healthQ.refetch();
                  } catch (e: any) {
                    toast.error(e?.response?.data?.message ?? "Failed");
                  }
                }}
              >Webhook missing — click to fix</button>
        )}
        {licenseQ.data?.bypass && <Badge variant="secondary" className="text-xs">Dev bypass</Badge>}
        {!licensed && !licenseQ.isLoading && !licenseQ.data?.bypass && (
          <Badge variant="destructive" className="text-xs">Not licensed</Badge>
        )}
      </div>

      <LicenseSection siteId={siteId} />

      {licenseQ.isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : !licensed ? (
        <Card>
          <CardContent className="py-12 text-center">
            <KeyRound className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="font-medium">License required</p>
            <p className="text-muted-foreground text-sm">Activate a license above to map forms to integrations.</p>
          </CardContent>
        </Card>
      ) : formsQ.isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : needsReconnect ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Unplug className="mx-auto mb-3 size-10 text-amber-500" />
            <p className="font-medium">Webflow access lost</p>
            <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto">
              {formsQ.data?.message ?? "Webflow no longer recognizes this site for the connected account."}
            </p>
            <Button className="mt-4" onClick={() => (window.location.href = dashboardApi.connectWebflowUrl())}>
              <Plus className="size-4" /> Reconnect Webflow
            </Button>
          </CardContent>
        </Card>
      ) : cards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-3 size-10 text-muted-foreground" />
            <p className="font-medium">No forms yet</p>
            <p className="text-muted-foreground text-sm">Publish a form on this site to see it here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {cards.map((f) => {
            const mapping = mappingByForm.get(f.id) ?? (f.formElementId ? mappingByElementId.get(f.formElementId) : undefined);
            const provider = mapping ? providerByType.get(String(mapping.type).toLowerCase()) : null;
            return (
              <Card key={f.id} className={licensed ? "" : "opacity-60"}>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <FileText className="mt-0.5 size-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="truncate font-medium">{f.displayName}</p>
                        {mapping && <Badge className="bg-emerald-500/15 text-emerald-600 text-[10px]">Mapped</Badge>}
                      </div>
                      <p className="text-muted-foreground truncate text-xs mt-0.5 flex items-center gap-2">
                        <span>{f.pageName} · {f.fields.length} field{f.fields.length === 1 ? "" : "s"}</span>
                        {f.designerUrl && (
                          <a
                            href={f.designerUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 hover:text-foreground"
                            title="Open in Webflow Designer"
                          >
                            <Pencil className="size-3" /> Designer
                          </a>
                        )}
                        {f.pageUrl && (
                          <a
                            href={f.pageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 hover:text-foreground"
                            title={`Open ${f.pageUrl}`}
                          >
                            <ExternalLink className="size-3" /> Live
                          </a>
                        )}
                      </p>
                      {mapping && provider && (
                        <p className="text-muted-foreground truncate text-xs mt-1">
                          → {provider.name}{mapping.config?.destinationLabel ? ` · ${mapping.config.destinationLabel}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {mapping ? (
                      <>
                        <Button variant="ghost" size="sm" title="Edit mapping" disabled={!licensed}
                          onClick={() => { setEditing({ id: mapping.id, credentialId: mapping.credentialId, config: mapping.config }); setAddFor(f); }}>
                          <Pencil className="size-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Disconnect" disabled={del.isPending}
                          onClick={() => { if (confirm("Disconnect this integration from the form?")) del.mutate(mapping.id); }}>
                          <Unplug className="size-4 text-red-500" />
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="sm" title="Add mapping" disabled={!licensed}
                        onClick={() => { setEditing(null); setAddFor(f); }}>
                        <Plus className="size-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {addFor && (
        <AddMappingDialog
          open={!!addFor}
          onOpenChange={(v) => { if (!v) { setAddFor(null); setEditing(null); } }}
          siteId={siteId}
          formId={addFor.id}
          pageId={addFor.pageId}
          formElementId={addFor.formElementId}
          formName={addFor.displayName}
          webflowFields={addFor.fields}
          editing={editing}
          existingTypes={integrations
            .filter((i: any) => i.formId === addFor.id && (!editing || i.id !== editing.id) && i.isActive)
            .map((i: any) => i.type)}
        />
      )}
    </>
  );
}

function LicenseSection({ siteId }: { siteId: string }) {
  const qc = useQueryClient();
  const licQ = useQuery({
    queryKey: ["license", siteId],
    queryFn: async () => (await dashboardApi.siteLicense(siteId)).data,
  });
  const [key, setKey] = useState("");

  const activate = useMutation({
    mutationFn: () => dashboardApi.activateLicense(siteId, key.trim()),
    onSuccess: (r) => {
      if (r.data.ok) {
        toast.success("License activated");
        qc.invalidateQueries({ queryKey: ["license", siteId] });
        qc.invalidateQueries({ queryKey: ["integrations", siteId] });
      } else {
        toast.error(r.data.message ?? "Activation failed");
      }
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Activation failed"),
  });

  const deactivate = useMutation({
    mutationFn: () => dashboardApi.deactivateLicense(siteId),
    onSuccess: () => {
      toast.success("License deactivated");
      qc.invalidateQueries({ queryKey: ["license", siteId] });
      qc.invalidateQueries({ queryKey: ["integrations", siteId] });
    },
  });

  if (licQ.data?.bypass) return null;
  const lic = licQ.data;
  const active = !!lic?.licensed;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <KeyRound className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">License</span>
            <Badge variant={active ? "secondary" : "destructive"} className="text-xs">
              {active ? "Active" : "Not licensed"}
            </Badge>
            {lic?.expireAt && active && (
              <span className="text-xs text-muted-foreground">expires {new Date(lic.expireAt).toLocaleDateString()}</span>
            )}
          </div>
          {active ? (
            <Button variant="outline" size="sm" disabled={deactivate.isPending} onClick={() => deactivate.mutate()}>
              Deactivate
            </Button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <Input
                placeholder="License key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="h-8 w-56 text-sm font-mono"
              />
              <Button size="sm" disabled={!key.trim() || activate.isPending} onClick={() => activate.mutate()}>
                Activate
              </Button>
              {lic?.activationUrl && (
                <a href={lic.activationUrl} target="_blank" rel="noreferrer"
                   className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  Get a license <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
