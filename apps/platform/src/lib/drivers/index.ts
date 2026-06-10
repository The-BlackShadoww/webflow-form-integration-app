import type { IntegrationType, IntegrationDriver } from "@/lib/drivers/types";
import { webhookDriver } from "./webhookDriver";
import { zapierDriver } from "./zapierDriver";
import { makeDriver } from "./makeDriver";
import { mailchimpDriver } from "./mailchimpDriver";
import { brevoDriver } from "./brevoDriver";
import { mailerLiteDriver } from "./mailerLiteDriver";
import { klaviyoDriver } from "./klaviyoDriver";
import { emailOctopusDriver } from "./emailOctopusDriver";
import { moosendDriver } from "./MoosendDriver";
import { omnisendDriver } from "./omnisendDriver";
import { senderDriver } from "./senderDriver";
import { activeCampaignDriver } from "./activeCampaignDriver";
import { getResponseDriver } from "./getResponseDriver";
import { notionDriver } from "./notionDriver";
import { discordDriver } from "./discordDriver";
import { hubspotDriver } from "./hubspotDriver";
import { slackDriver } from "./slackDriver";
import { airtableDriver } from "./airtableDriver";
import { constantContactDriver } from "./constantContactDriver";
import { googleSheetDriver } from "./googleSheetDriver";

// Drivers wired now (no-OAuth path).
// OAuth-dependent drivers (hubspot, notion, slack, discord, google-sheet, airtable,
// constant-contact, getresponse) ship after OAuth callback routes are built.
const registry: Partial<Record<IntegrationType, IntegrationDriver>> = {
  WEBHOOK: webhookDriver as IntegrationDriver,
  WEBHOOKCONNECTION: webhookDriver as IntegrationDriver,
  ZAPIER: zapierDriver as IntegrationDriver,
  ZAPIERCONNECTION: zapierDriver as IntegrationDriver,
  MAKE: makeDriver as IntegrationDriver,
  MAILCHIMP: mailchimpDriver as IntegrationDriver,
  MAILCHIMPAPI: mailchimpDriver as IntegrationDriver,
  BREVO: brevoDriver as IntegrationDriver,
  MAILERLITE: mailerLiteDriver as IntegrationDriver,
  KLAVIYO: klaviyoDriver as IntegrationDriver,
  KLAVIYOAPI: klaviyoDriver as IntegrationDriver,
  EMAILOCTOPUS: emailOctopusDriver as IntegrationDriver,
  MOONSEND: moosendDriver as IntegrationDriver,
  OMNISEND: omnisendDriver as IntegrationDriver,
  SENDER: senderDriver as IntegrationDriver,
  ACTIVECAMPAIGN: activeCampaignDriver as IntegrationDriver,
  GETRESPONSE: getResponseDriver as IntegrationDriver,
  GETRESPONSECONNECTION: getResponseDriver as IntegrationDriver,
  NOTION: notionDriver as IntegrationDriver,
  NOTIONCONNECTION: notionDriver as IntegrationDriver,
  DISCORD: discordDriver as IntegrationDriver,
  DISCORDCONNECTION: discordDriver as IntegrationDriver,
  HUBSPOT: hubspotDriver as IntegrationDriver,
  HUBSPOTCONNECTION: hubspotDriver as IntegrationDriver,
  SLACK: slackDriver as IntegrationDriver,
  SLACKCONNECTION: slackDriver as IntegrationDriver,
  AIRTABLE: airtableDriver as IntegrationDriver,
  CONSTANTCONTACT: constantContactDriver as IntegrationDriver,
  GOOGLESHEET: googleSheetDriver as IntegrationDriver,
  GOOGLECONNECTION: googleSheetDriver as IntegrationDriver,
};

export function getDriver(type: IntegrationType): IntegrationDriver | null {
  return registry[type] ?? null;
}

export function hasDriver(type: IntegrationType): boolean {
  return type in registry;
}
