import type { IntegrationType, IntegrationDriver } from "@/lib/drivers/types";
import { webhookDriver } from "./webhookDriver";
import { notionDriver } from "./notionDriver";

// Drivers wired now (no-OAuth path).
// OAuth-dependent drivers (hubspot, notion, slack, discord, google-sheet, airtable,
// constant-contact, getresponse) ship after OAuth callback routes are built.

const registry: Partial<Record<IntegrationType, IntegrationDriver>> = {
  WEBHOOK: webhookDriver as IntegrationDriver,
  WEBHOOKCONNECTION: webhookDriver as IntegrationDriver,
  NOTION: notionDriver as IntegrationDriver,
  NOTIONCONNECTION: notionDriver as IntegrationDriver,
};


export function getDriver(type: IntegrationType): IntegrationDriver | null {
  return registry[type] ?? null;
}

export function hasDriver(type: IntegrationType): boolean {
  return type in registry;
}
