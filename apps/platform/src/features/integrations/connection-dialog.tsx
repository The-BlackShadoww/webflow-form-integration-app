"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Pencil, PlayCircle, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { dashboardApi } from "@/lib/api";
import {
  type Provider,
  type AuthMode,
  providerTypeValues,
} from "@/features/integrations/providers";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ConnectionDialog({
  open,
  onOpenChange,
  presetProvider,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  presetProvider: Provider | null;
}) {
  const qc = useQueryClient();
  // Dialog is opened from /sites/[siteId]/integrations — use that for site-scoped test logs.
  const params = useParams<{ siteId?: string }>();
  const currentSiteId = params?.siteId;
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<AuthMode>("oauth");

  const credsQ = useQuery({
    queryKey: ["credentials"],
    queryFn: async () => (await dashboardApi.credentials()).data.credentials,
    enabled: open,
  });

  const provider = presetProvider;
  const validTypes = provider
    ? providerTypeValues(provider).map((t) => t.toLowerCase())
    : [];
  const list = (credsQ.data ?? []).filter((c: any) =>
    validTypes.includes(String(c.type).toLowerCase()),
  );

  useEffect(() => {
    if (open && presetProvider) {
      setName(`${presetProvider.name} integration`);
      setApiKey("");
      setUrl("");
      setMode(presetProvider.authMode);
    }
  }, [open, presetProvider]);

  const save = useMutation({
    mutationFn: () =>
      dashboardApi.createCredential({
        type: provider!.typeEnum,
        connectionName: name,
        apiKey: mode === "api_key" ? apiKey : undefined,
        url:
          mode === "webhook_url" || provider!.slug === "activecampaign"
            ? url
            : undefined,
        destinationLabel: mode === "webhook_url" ? url : undefined,
      }),
    onSuccess: () => {
      toast.success(`${provider!.name} integration added.`);
      qc.invalidateQueries({ queryKey: ["credentials"] });
      setName(`${provider!.name} integration`);
      setApiKey("");
      setUrl("");
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? "Save failed"),
  });

  const del = useMutation({
    mutationFn: (id: number) => dashboardApi.deleteCredential(id),
    onSuccess: () => {
      toast.success("Connection removed.");
      qc.invalidateQueries({ queryKey: ["credentials"] });
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? "Delete failed"),
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const update = useMutation({
    mutationFn: ({
      id,
      connectionName,
    }: {
      id: number;
      connectionName: string;
    }) => dashboardApi.updateCredential(id, { connectionName }),
    onSuccess: () => {
      toast.success("Renamed.");
      qc.invalidateQueries({ queryKey: ["credentials"] });
      setEditingId(null);
    },
    onError: (e: any) =>
      toast.error(e?.response?.data?.message ?? "Rename failed"),
  });

  if (!provider) return null;

  const supportsOauth = provider.authMode === "oauth";
  const supportsApiKey =
    provider.authMode === "api_key" || !!provider.supportsApiKey;
  const isWebhook = provider.authMode === "webhook_url";

  const apiKeyValid =
    mode === "api_key" &&
    !!apiKey &&
    (provider.slug === "activecampaign" ? !!url : true);
  const webhookValid = mode === "webhook_url" && !!url;
  const canSaveNonOauth = !!name.trim() && (apiKeyValid || webhookValid);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-normal tracking-tight">
            {provider.name}
          </DialogTitle>
        </DialogHeader>

        <section className="space-y-4">
          {!isWebhook && (
            <Tabs value={mode} onValueChange={(v) => setMode(v as AuthMode)}>
              <TabsList className="!w-full !grid !grid-cols-2 rounded-full bg-surface-strong p-1">
                <TabsTrigger
                  value="oauth"
                  disabled={!supportsOauth}
                  className="!rounded-full data-[state=active]:!bg-foreground data-[state=active]:!text-[var(--card)]"
                >
                  OAuth
                </TabsTrigger>
                <TabsTrigger
                  value="api_key"
                  disabled={!supportsApiKey}
                  className="!rounded-full data-[state=active]:!bg-foreground data-[state=active]:!text-[var(--card)]"
                >
                  API key
                </TabsTrigger>
              </TabsList>

              <TabsContent value="oauth" className="mt-5 space-y-4">
                <div className="grid gap-2">
                  <Label>Connection name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Click Connect to authorize {provider.name} in a popup window.
                </p>
                <OauthConnectButton
                  provider={provider}
                  name={name}
                  disabled={!name.trim() || !supportsOauth}
                  onConnected={() => {
                    toast.success(`${provider.name} connected.`);
                    qc.invalidateQueries({ queryKey: ["credentials"] });
                  }}
                />
              </TabsContent>

              <TabsContent value="api_key" className="mt-5 space-y-4">
                <div className="grid gap-2">
                  <Label>Connection name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>API key</Label>
                  <Input
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste your API key"
                  />
                </div>
                {provider.slug === "activecampaign" && (
                  <div className="grid gap-2">
                    <Label>Base URL</Label>
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://your-account.api-us1.com"
                    />
                  </div>
                )}
                <Button
                  size="sm"
                  onClick={() => save.mutate()}
                  disabled={
                    !canSaveNonOauth || save.isPending || !supportsApiKey
                  }
                >
                  {save.isPending && (
                    <Loader2 className="size-3.5 animate-spin" />
                  )}
                  <Check className="size-3.5" /> Save
                </Button>
              </TabsContent>
            </Tabs>
          )}

          {isWebhook && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Connection name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Webhook URL</Label>
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/..."
                />
              </div>
              <Button
                size="sm"
                onClick={() => save.mutate()}
                disabled={!canSaveNonOauth || save.isPending}
              >
                {save.isPending && (
                  <Loader2 className="size-3.5 animate-spin" />
                )}
                <Check className="size-3.5" /> Save
              </Button>
            </div>
          )}
        </section>

        <section className="mt-6 space-y-3 border-t border-border pt-6">
          <h3 className="text-[11px] font-semibold uppercase text-muted-foreground tracking-[0.1em]">
            Connections
          </h3>
          {credsQ.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading…
            </div>
          ) : list.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No {provider.name} connections yet.
            </p>
          ) : (
            <div className="space-y-2">
              {list.map((c: any) => {
                const isEditing = editingId === c.id;
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <Input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && editName.trim())
                              update.mutate({
                                id: c.id,
                                connectionName: editName.trim(),
                              });
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          className="h-8 text-sm"
                        />
                      ) : (
                        <>
                          <p className="truncate text-sm font-medium">
                            {c.connectionName}
                          </p>
                          {c.url && (
                            <p className="text-muted-foreground truncate text-xs">
                              {c.url}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!editName.trim() || update.isPending}
                            onClick={() =>
                              update.mutate({
                                id: c.id,
                                connectionName: editName.trim(),
                              })
                            }
                          >
                            <Check className="size-4 text-emerald-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="size-4 text-muted-foreground" />
                          </Button>
                        </>
                      ) : (
                        <>
                          {provider.authMode === "webhook_url" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const { data } =
                                    await dashboardApi.testCredential(
                                      c.id,
                                      currentSiteId,
                                    );
                                  if (data.ok)
                                    toast.success(
                                      `Test sent${data.status ? ` (HTTP ${data.status})` : ""}`,
                                    );
                                  else toast.error(data.error || "Test failed");
                                } catch (e: any) {
                                  toast.error(
                                    e?.response?.data?.message ?? "Test failed",
                                  );
                                }
                              }}
                            >
                              <PlayCircle className="size-4 text-muted-foreground" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(c.id);
                              setEditName(c.connectionName);
                            }}
                          >
                            <Pencil className="size-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={del.isPending}
                            onClick={() => {
                              if (confirm(`Remove "${c.connectionName}"?`))
                                del.mutate(c.id);
                            }}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}

function OauthConnectButton({
  provider,
  name,
  disabled,
  onConnected,
}: {
  provider: Provider;
  name: string;
  disabled?: boolean;
  onConnected: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="sm"
      disabled={disabled || busy}
      onClick={() => {
        const token = useAuthStore.getState().token;
        if (!token) return toast.error("Not signed in");
        const installUrl = `/api/integrations/${provider.slug}/install?token=${encodeURIComponent(token)}&name=${encodeURIComponent(name)}`;
        const popup = window.open(
          installUrl,
          `${provider.slug}-oauth`,
          "width=600,height=700",
        );
        if (!popup) return toast.error("Popup blocked");
        setBusy(true);
        const onMsg = (ev: MessageEvent) => {
          if (
            ev.data?.source !== "flowappz-oauth" ||
            ev.data?.provider !== provider.slug
          )
            return;
          window.removeEventListener("message", onMsg);
          setBusy(false);
          if (ev.data.ok) onConnected();
          else toast.error(ev.data.message ?? "Connect failed");
        };
        window.addEventListener("message", onMsg);
        const poll = setInterval(() => {
          if (popup.closed) {
            clearInterval(poll);
            setBusy(false);
            window.removeEventListener("message", onMsg);
          }
        }, 600);
      }}
    >
      {busy && <Loader2 className="size-3.5 animate-spin" />}
      <Check className="size-3.5" /> Connect with {provider.name}
    </Button>
  );
}
