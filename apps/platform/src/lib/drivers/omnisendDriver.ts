// @ts-nocheck — ported from old backend; cleanup later
import { db } from "@/lib/db";
import { IntegrationRecord, IntegrationDriver } from "@/lib/drivers/types";
import { ensureEmailOrThrow } from "@/lib/integration-helpers/helper";
import { buildMergeFields } from "@/lib/integration-utils";

export const omnisendDriver: IntegrationDriver = {
  send: async (
    _integrationId: number,
    _event: string,
    _formId: string,
    payload: any,
    _config: any,
    integration: IntegrationRecord
  ) => {

    // 🔹 Fetch integration credentials
    const integrationCredential = await db.integrationCredential.findUnique({
      where: { id: integration.credentialId as number },
    });

    if (!integrationCredential) {
      throw new Error("Integration credential not found");
    }

    const apiKey = integrationCredential.apiKey;
    if (!apiKey) {
      throw new Error("Omnisend API key missing in credentials.");
    }

    // 🔹 Build merge fields (custom properties)
    const mergeFieldsConfig = integration.config.merge_fields || {};
    const mergeFieldsWithData = buildMergeFields(payload, mergeFieldsConfig);

    // 🔹 Get contact email from payload
    const contactEmail = ensureEmailOrThrow(payload);

    // 🔹 Create contact payload (Omnisend v5)
    const requestBody: any = {
      identifiers: [
        {
          type: "email",
          id: contactEmail,
          channels: {
            email: {
              status: "subscribed", // REQUIRED for Omnisend to accept
            },
          },
        },
      ],
    };

    // 🔹 Add custom properties (optional)
    if (Object.keys(mergeFieldsWithData).length > 0) {
      requestBody.customProperties = mergeFieldsWithData;
    }

    try {
      // 🔸 Create/Update contact using Omnisend v5 API
      const response = await fetch("https://api.omnisend.com/v5/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify(requestBody),
      });


      const text = await response.text();
      let result: any = null;

      if (text) {
        try {
          result = JSON.parse(text);
        } catch {
          console.warn("⚠️ Non-JSON response from Omnisend:", text);
        }
      }

      // Handle errors
      if (!response.ok) {
        console.error("❌ Omnisend API Error:", result || text);

        throw new Error(
          result?.error ||
          result?.message ||
          `Omnisend request failed: ${response.status} ${response.statusText}`
        );
      }

      // ✔ Success — Omnisend returns 200
      return;

    } catch (error: any) {
      console.error("❌ Omnisend API call failed:", error);
      throw new Error(error.message || "Failed to send contact to Omnisend.");
    }
  },
};
