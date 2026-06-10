import type { IntegrationType as PrismaIntegrationType } from "@prisma/client";

export type IntegrationType = PrismaIntegrationType;

export interface IntegrationRecord {
  id: number;
  siteId: string;
  formId: string;
  pageId: string;
  integrationName?: string | null;
  type: IntegrationType;
  config: any;
  isActive: boolean;
  retryCount: number;
  lastSuccess?: Date | null;
  lastError?: string | null;
  credentialId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationDriver {
  send: (
    integrationId: number,
    event: string,
    formId: string,
    payload: any,
    config: any,
    integration: IntegrationRecord,
  ) => Promise<void>;
}
