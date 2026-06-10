"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { dashboardApi } from "@/lib/api";
import { providers, findProviderForType } from "@/features/integrations/providers";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type EditingMapping = { id: number; credentialId: number; config: any };

export function AddMappingDialog({
  open, onOpenChange, siteId, formId, pageId, formElementId, formName, webflowFields, editing = null, existingTypes = [],
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  siteId: string;
  formId: string;
  pageId: string;
  formElementId: string | null;
  formName: string;
  webflowFields: Array<{ id: string; displayName: string }>;
  editing?: EditingMapping | null;
  existingTypes?: string[];
}) {
  const qc = useQueryClient();
  const [credentialId, setCredentialId] = useState<string | null>(null);
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [destinationLabel, setDestinationLabel] = useState<string | null>(null);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (editing) {
        setCredentialId(String(editing.credentialId));
        setDestinationId(editing.config?.destinationId ?? null);
        setDestinationLabel(editing.config?.destinationLabel ?? null);
        const fm: Record<string, string> = {};
        (editing.config?.fieldMapping ?? []).forEach((p: any) => {
          // Accept both new shape (webflowField = displayName, webflowFieldId = id) and legacy (webflowField = id).
          const id =
            p.webflowFieldId ??
            webflowFields.find((f) => f.displayName === p.webflowField)?.id ??
            p.webflowField;
          fm[id] = p.providerField;
        });
        setFieldMapping(fm);
      } else {
        setCredentialId(null); setDestinationId(null); setDestinationLabel(null); setFieldMapping({});
      }
    }
  }, [open, editing]);

  const credsQ = useQuery({
    queryKey: ["credentials"],
    queryFn: async () => (await dashboardApi.credentials()).data.credentials,
    enabled: open,
  });
  const selectedCred = credsQ.data?.find((c: any) => String(c.id) === credentialId);
  const provider = findProviderForType(selectedCred?.type);
  const needsDestination = provider?.authMode === "oauth" || provider?.authMode === "api_key";
  // Treat aliases (e.g. NOTIONCONNECTION vs NOTION) as the same provider when checking for duplicates.
  const duplicateTypeWarning =
    !!provider &&
    existingTypes.some((t) => findProviderForType(t)?.slug === provider.slug);

  useEffect(() => {
    if (selectedCred && !needsDestination) {
      setDestinationId(selectedCred.url ?? null);
      setDestinationLabel(selectedCred.extraData?.destinationLabel ?? selectedCred.url ?? null);
    }
  }, [selectedCred, needsDestination]);

  const destsQ = useQuery({
    queryKey: ["destinations", provider?.slug, selectedCred?.id],
    queryFn: async () => (await dashboardApi.destinations(provider!.slug, selectedCred?.id)).data.destinations,
    enabled: !!provider && needsDestination && !!selectedCred,
  });
  const fieldsQ = useQuery({
    queryKey: ["provider-fields", provider?.slug, destinationId, selectedCred?.id],
    queryFn: async () => (await dashboardApi.providerFields(provider!.slug, destinationId, selectedCred?.id)).data.fields,
    enabled: !!provider && !!destinationId,
  });

  const buildPayload = () => ({
    type: selectedCred.type,
    integrationName: `${provider?.name ?? selectedCred.type}${destinationLabel ? ` → ${destinationLabel}` : ""}`,
    config: {
      authMode: provider?.authMode,
      credentialId: Number(credentialId),
      destinationId,
      destinationLabel,
      fieldMapping: Object.entries(fieldMapping).map(([wfFieldId, providerField]) => {
        const wf = webflowFields.find((f) => f.id === wfFieldId);
        // Webflow's form_submission webhook keys data by displayName, so store both for compatibility.
        return { webflowField: wf?.displayName ?? wfFieldId, webflowFieldId: wfFieldId, providerField };
      }),
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const payload = buildPayload();
      if (editing) {
        await dashboardApi.updateMapping(editing.id, { integrationName: payload.integrationName, config: payload.config });
      } else {
        await dashboardApi.createMapping(siteId, formId, { credentialId: Number(credentialId), pageId, formElementId, ...payload });
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Mapping updated." : "Mapping saved.");
      qc.invalidateQueries({ queryKey: ["mappings", siteId, formId] });
      qc.invalidateQueries({ queryKey: ["integrations", siteId] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Save failed"),
  });

  const canSubmit = !!selectedCred && !!destinationId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="truncate">
            {editing ? "Edit mapping" : "Add mapping"} · <span className="text-muted-foreground font-normal">{formName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Integration</Label>
            {credsQ.isLoading ? (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading…
              </div>
            ) : credsQ.data?.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No integrations yet — add one from the Integrations page first.</p>
            ) : (
              <Select value={credentialId ?? undefined} onValueChange={setCredentialId} disabled={!!editing}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Pick an integration" /></SelectTrigger>
                <SelectContent>
                  {credsQ.data?.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.connectionName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedCred && provider && needsDestination && (
            <div>
              <Label>{provider.name} destination</Label>
              {destsQ.isLoading ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Loading destinations…
                </div>
              ) : (
                <Select
                  value={destinationId ?? undefined}
                  onValueChange={(v) => {
                    const d = destsQ.data?.find((x) => x.id === v);
                    setDestinationId(v); setDestinationLabel(d?.name ?? null); setFieldMapping({});
                  }}
                >
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Pick a destination" /></SelectTrigger>
                  <SelectContent>
                    {(destsQ.data ?? []).map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {selectedCred && provider && destinationId && (
            <div>
              <Label>Field mapping</Label>
              <p className="text-muted-foreground mb-2 text-xs">Map each Webflow field to {provider.name}.</p>
              {webflowFields.length === 0 ? (
                <p className="text-sm text-muted-foreground">No Webflow fields detected.</p>
              ) : (
                <div className="space-y-1.5">
                  {webflowFields.map((wf) => {
                    const mapped = !!fieldMapping[wf.id];
                    return (
                      <div key={wf.id} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
                        <div className="rounded-md bg-muted/50 px-2 py-1.5 text-xs">{wf.displayName}</div>
                        <span className="text-muted-foreground text-xs">→</span>
                        <Select
                          value={fieldMapping[wf.id] ?? ""}
                          onValueChange={(v) => setFieldMapping({ ...fieldMapping, [wf.id]: v })}
                        >
                          <SelectTrigger className="h-8"><SelectValue placeholder="Pick" /></SelectTrigger>
                          <SelectContent>
                            {(fieldsQ.data ?? []).map((f) => {
                              const unsupported = f.supported === false;
                              return (
                                <SelectItem key={f.id} value={f.id} disabled={unsupported}>
                                  <span className="flex items-center gap-2">
                                    {f.name}
                                    {f.type && (
                                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                        {f.type}
                                      </span>
                                    )}
                                    {unsupported && (
                                      <span className="text-[10px] uppercase tracking-wider text-destructive">
                                        not supported
                                      </span>
                                    )}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={!mapped}
                          aria-label="Clear mapping"
                          onClick={() => {
                            const next = { ...fieldMapping };
                            delete next[wf.id];
                            setFieldMapping(next);
                          }}
                        >
                          <X className="size-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {duplicateTypeWarning && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
              <p className="font-medium">Heads up — {provider?.name ?? "this provider"} is already mapped to this form.</p>
              <p className="mt-1 text-amber-800/80 dark:text-amber-200/80">
                Adding another mapping will cause every submission to deliver twice (e.g., duplicate Notion rows). Edit the existing mapping instead if you want to change it.
              </p>
            </div>
          )}

          <div className="border-t pt-4">
            <Button size="sm" onClick={() => submit.mutate()} disabled={!canSubmit || submit.isPending}>
              {submit.isPending && <Loader2 className="size-3.5 animate-spin" />}
              <Check className="size-3.5" /> {editing ? "Update" : duplicateTypeWarning ? "Save anyway" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
