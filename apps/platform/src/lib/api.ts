"use client";
import axios from "axios";
import { useAuthStore } from "@/lib/auth-store";

// All calls go to our own Next.js API routes — same origin
export const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) useAuthStore.getState().reset();
    return Promise.reject(err);
  },
);

// ─── Auth ─────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{
      token: string;
      user: { id: number; email: string; name: string | null };
    }>("/auth/login", { email, password }),
  signup: (email: string, password: string, name?: string) =>
    api.post<{
      token: string;
      user: { id: number; email: string; name: string | null };
    }>("/auth/signup", { email, password, name }),
  me: () =>
    api.get<{ user: { id: number; email: string; name: string | null } }>(
      "/auth/me",
    ),
  updateMe: (body: { name: string }) =>
    api.patch<{ user: { id: number; email: string; name: string | null } }>(
      "/auth/me",
      body,
    ),
  deleteMe: () => api.delete("/auth/me"),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api.post("/auth/change-password", body),
  requestPasswordReset: (email: string) =>
    api.post("/auth/reset-password", { email }),
  confirmPasswordReset: (token: string, newPassword: string) =>
    api.post("/auth/reset-password/confirm", { token, newPassword }),
};

// ─── Dashboard ────────────────────────────────────────────────────
export type DashboardSite = {
  id: number;
  siteId: string;
  displayName: string;
  previewUrl: string | null;
  workspaceId: string;
  createdAt: string;
  integrations: string[];
};

export const dashboardApi = {
  sites: () => api.get<{ sites: DashboardSite[] }>("/dashboard/sites"),
  forms: (siteId: string) =>
    api.get<{ forms: any[]; needsReconnect?: boolean; message?: string }>(
      `/dashboard/sites/${siteId}/forms`,
    ),
  siteLicense: (siteId: string) =>
    api.get<{
      licensed: boolean;
      bypass?: boolean;
      status: string;
      key?: string;
      activated?: string | null;
      expireAt?: string | null;
      activationUrl?: string;
    }>(`/dashboard/sites/${siteId}/license`),
  activateLicense: (siteId: string, key: string) =>
    api.post<{ ok: boolean; message?: string }>(
      `/dashboard/sites/${siteId}/license/activate`,
      { key },
    ),
  deactivateLicense: (siteId: string) =>
    api.post<{ ok: boolean }>(
      `/dashboard/sites/${siteId}/license/deactivate`,
      {},
    ),
  integrations: (siteId: string) =>
    api.get<{ integrations: any[] }>(`/dashboard/sites/${siteId}/integrations`),
  allIntegrations: () =>
    api.get<{ integrations: any[] }>("/dashboard/integrations"),
  credentials: () => api.get<{ credentials: any[] }>("/dashboard/credentials"),
  createCredential: (body: any) =>
    api.post<{ credential: any }>("/dashboard/credentials", body),
  updateCredential: (id: number, body: { connectionName: string }) =>
    api.patch<{ credential: any }>(`/dashboard/credentials/${id}`, body),
  deleteCredential: (id: number) => api.delete(`/dashboard/credentials/${id}`),
  formMappings: (siteId: string, formId: string) =>
    api.get<{ mappings: any[] }>(
      `/dashboard/sites/${siteId}/forms/${formId}/mappings`,
    ),
  createMapping: (siteId: string, formId: string, body: any) =>
    api.post<{ mapping: any }>(
      `/dashboard/sites/${siteId}/forms/${formId}/mappings`,
      body,
    ),
  updateMapping: (
    id: number,
    body: { config: any; integrationName?: string },
  ) => api.patch<{ mapping: any }>(`/dashboard/mappings/${id}`, body),
  deleteMapping: (id: number) => api.delete(`/dashboard/mappings/${id}`),
  helpTutorials: () =>
    api.get<{ tutorials: Array<{ name: string; url: string }> }>(
      "/dashboard/help/tutorials",
    ),
  logs: (params?: { siteId?: string; status?: string; limit?: number }) =>
    api.get<{
      logs: Array<{
        id: string;
        siteId: string;
        formId: string;
        integrationType: string;
        status: string;
        message: string | null;
        createdAt: string;
      }>;
    }>("/dashboard/logs", { params }),
  syncSites: () => api.post<{ synced: number }>("/dashboard/sites/sync"),
  repairWebhook: (siteId: string) =>
    api.post<{ ok: boolean }>(`/dashboard/sites/${siteId}/webhook-health`),
  webhookHealth: (siteId: string) =>
    api.get<{
      ok: boolean;
      expected: string;
      webhooks: Array<{ id: string; url: string; triggerType: string }>;
    }>(`/dashboard/sites/${siteId}/webhook-health`),
  testCredential: (id: number, siteId?: string) =>
    api.post<{ ok: boolean; status?: number; error?: string }>(
      `/dashboard/credentials/${id}/test`,
      siteId ? { siteId } : {},
    ),
  destinations: (provider: string, credentialId?: number) =>
    api.get<{ destinations: Array<{ id: string; name: string }> }>(
      `/dashboard/providers/${provider}/destinations`,
      { params: credentialId ? { credentialId } : undefined },
    ),
  providerFields: (
    provider: string,
    destinationId?: string | null,
    credentialId?: number,
  ) =>
    api.get<{
      fields: Array<{
        id: string;
        name: string;
        type?: string;
        supported?: boolean;
      }>;
    }>(`/dashboard/providers/${provider}/fields`, {
      params: {
        ...(destinationId ? { destinationId } : {}),
        ...(credentialId ? { credentialId } : {}),
      },
    }),
  connectWebflowUrl: () => {
    const token = useAuthStore.getState().token;
    return `/api/webflow/install?state=${encodeURIComponent(token)}`;
  },
};
