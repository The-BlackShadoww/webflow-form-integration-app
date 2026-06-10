// @ts-nocheck — ported from old backend; cleanup later
import {
  IntegrationDriver,
  IntegrationRecord,
} from "@/lib/drivers/types";
import { db } from "@/lib/db";
import { validateUrlSecurity } from "@/lib/url-security";

export const buildMakeWebhookBody = (
  event: string,
  formId: string,
  payload: unknown,
) => ({
  event,
  formId,
  payload,
});


export const makeDriver: IntegrationDriver = {
  send: async (
    _integrationId: number,
    event: string,
    formId: string,
    payload: any,
    _config: any,
    integration: IntegrationRecord,
  ) => {
    if (!event) {
      throw new Error("Missing event for Make integration dispatch");
    }

    if (payload === undefined) {
      throw new Error("Missing payload for Make integration dispatch");
    }

    const newconfig = await db.integrationCredential.findUnique({
      where: { id: integration.credentialId as number },
    });

    if (!newconfig) {
      throw new Error("Config not found");
    }
    const { url, apiKey } = newconfig;

    if (!url) throw new Error("Missing Make Webhook URL");

    await validateUrlSecurity(url);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(buildMakeWebhookBody(event, formId, payload)),
    });


    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `make webhook request failed with status ${response.status}: ${errorBody}`,
      );
    }
  },
};
