// @ts-nocheck — ported from old backend; cleanup later
import { db } from "@/lib/db";
import { IntegrationRecord, IntegrationDriver } from "@/lib/drivers/types";
import { buildMergeFields } from "@/lib/integration-utils";

export const brevoDriver: IntegrationDriver = {
  send: async (
      integrationId: number,
      event: string,
      formId: string,
      payload: any,
      config: any,
      integration: IntegrationRecord
  ) => {
    const integrationCredential = await db.integrationCredential.findUnique({
      where: { id: integration.credentialId as number },
    });

    if (!integrationCredential) {
      throw new Error("Config not found");
    }

    const apiKey = integrationCredential.apiKey;
    if (!apiKey) {
      throw new Error("Brevo API key missing in integration credentials.");
    }

    const buildMergeFieldsWithData = buildMergeFields(
        payload,
        integration.config.merge_fields
    );

    const contactEmail =
        payload.email || payload.Email
            ? payload.email ?? payload.Email
            : `flowappz${Math.floor(Math.random() * 1000)}@gmail.com`;

    const contactBody = {
      email: contactEmail,
      attributes: buildMergeFieldsWithData,
      listIds: [Number(integration.config.listId)],
      updateEnabled: true,
    };

    try {
      const response = await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(contactBody),
      });

      // If Brevo returns no content (204), don't parse JSON
      let result: any = null;
      const text = await response.text();
      if (text) {
        try {
          result = JSON.parse(text);
        } catch (jsonErr) {
          console.warn("⚠️ Non-JSON response from Brevo:", text);
        }
      }

      if (!response.ok) {
        console.error("❌ Brevo API error:", result || text);
        throw new Error(
            result?.message ||
            result?.error ||
            `Brevo request failed: ${response.status} ${response.statusText}`
        );
      }

      console.log("✅ Brevo contact created/updated:", result);
      return result;
    } catch (error: any) {
      console.error("❌ Brevo API call failed:", error);
      throw new Error(error.message || "Failed to send data to Brevo.");
    }
  },
};
