// @ts-nocheck — ported from old backend; cleanup later
import { db } from "@/lib/db";
import { IntegrationRecord, IntegrationDriver } from "@/lib/drivers/types";
import { ensureEmailOrThrow, transformFields } from "@/lib/integration-helpers/helper";

export const moosendDriver: IntegrationDriver = {
  send: async (
    _integrationId: number,
    _event: string,
    _formId: string,
    payload: any,
    _config: any,
    integration: IntegrationRecord,
  ) => {
    // 01. Fetch integration credentials
    const integrationCredential = await db.integrationCredential.findUnique({
      where: { id: integration.credentialId as number },
    });

    if (!integrationCredential) {
      throw new Error("Moosend config not found");
    }

    const apiKey = integrationCredential.apiKey;
    if (!apiKey) {
      throw new Error("Moosend API key missing in credentials.");
    }

    const email = ensureEmailOrThrow(payload)

    const { topLevelFields, customFields } = transformFields(
      integration.config.merge_fields,
      payload,
    );

    const formattedCustomFields = customFields.map(
      (f: any) => `${f.Name}=${f.Value}`,
    );

    const contactBody: any = {
      Email: email,
      ...topLevelFields,
    };

    if (formattedCustomFields && formattedCustomFields.length > 0) {
      contactBody.CustomFields = formattedCustomFields;
    }

    const url = `https://api.moosend.com/v3/subscribers/${integration.config.listId}/subscribe.json?apikey=${apiKey}&ForceSubscribe=true`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(contactBody),
      });

      let result: any = null;
      const text = await response.text();

      if (text) {
        try {
          result = JSON.parse(text);
        } catch (err) {
          console.warn("⚠️ Non-JSON response from Moosend:", text);
        }
      }

      if (!response.ok) {
        console.error("❌ Moosend API error:", result || text);
        throw new Error(
          result?.Error ||
            result?.Message ||
            `Moosend request failed: ${response.status} ${response.statusText}`,
        );
      }

      if (result?.Error){
        throw new Error(result?.Error || "");
      }

      console.log("✅ Moosend contact created/updated", result);
      return result;
    } catch (error: any) {
      console.error("❌ Moosend API call failed:", error);
      throw new Error(error.message || "Failed to send data to Moosend.");
    }
  },
};
