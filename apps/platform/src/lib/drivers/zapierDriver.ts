// @ts-nocheck — ported from old backend; cleanup later
import { IntegrationDriver, IntegrationRecord } from "@/lib/drivers/types";
import { db } from "@/lib/db";
import { validateUrlSecurity } from "@/lib/url-security";


export const zapierDriver: IntegrationDriver = {
  send: async (
    _integrationId: number,
    event: string,
    formId: string,
    payload: any,
    _config: any,
    integration: IntegrationRecord,
  ) => {


    const newconfig = await db.integrationCredential.findUnique({
      where: { id: integration.credentialId as number },
    });

    if (!newconfig) {
      throw new Error("Config not found");
    }
    const { url, apiKey } = newconfig;

    if (!url) throw new Error("Missing Zapier Webhook URL");


    await validateUrlSecurity(url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({ event, formId, payload }),
    });


    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Zapier webhook request failed with status ${response.status}: ${errorBody}`);
    }
  },
};
