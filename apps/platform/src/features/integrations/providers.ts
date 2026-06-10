export type AuthMode = "oauth" | "api_key" | "webhook_url";

export type Provider = {
  slug: string;          // URL-friendly identifier (lowercase, hyphenated)
  typeEnum: string;      // Prisma IntegrationType enum value (UPPERCASE)
  name: string;
  authMode: AuthMode;
  description: string;
  enabled?: boolean;     // if false, render disabled card
  supportsApiKey?: boolean; // OAuth providers that also accept a static token (Notion integration token, HubSpot private app, Slack/Discord bot, Airtable PAT, etc.)
  typeAliases?: string[]; // Additional Prisma IntegrationType values that belong to this provider (e.g. OAuth callbacks save NOTIONCONNECTION while API-key path saves NOTION).
};

export function providerTypeValues(p: Provider): string[] {
  return [p.typeEnum, ...(p.typeAliases ?? [])];
}

export function findProviderForType(type: string | null | undefined): Provider | undefined {
  if (!type) return undefined;
  const upper = String(type).toUpperCase();
  return providers.find((p) => providerTypeValues(p).includes(upper));
}

export const providers: Provider[] = [
  // OAuth
  { slug: "notion",          typeEnum: "NOTION",          name: "Notion",          authMode: "oauth",       description: "Append form submissions to a Notion database.", enabled: true, supportsApiKey: true, typeAliases: ["NOTIONCONNECTION"] },
  // Webhook URL — no creds needed
  { slug: "webhook",         typeEnum: "WEBHOOK",         name: "Webhook",         authMode: "webhook_url", description: "POST form submissions to any URL.", enabled: true, typeAliases: ["WEBHOOKCONNECTION"] },
];
