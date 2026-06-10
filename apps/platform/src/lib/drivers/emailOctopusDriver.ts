// @ts-nocheck — ported from old backend; cleanup later
import { db } from "@/lib/db";
import { IntegrationRecord, IntegrationDriver } from "@/lib/drivers/types";
import { buildMergeFields } from "@/lib/integration-utils";
import { ensureEmailOrThrow } from "@/lib/integration-helpers/helper";

export const emailOctopusDriver: IntegrationDriver = {
  send: async (
    integrationId: number,
    event: string,
    formId: string,
    payload: any,
    config: any,
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
      throw new Error(
        "EmailOctopus API key missing in integration credentials."
      );
    }

    const listId = integration.config.listId;
    if (!listId) {
      throw new Error("EmailOctopus list ID is missing in integration config.");
    }

    // 🔹 Merge fields mapping
    const mergeFields = buildMergeFields(payload, integration.config.merge_fields);

    // 🔹 Ensure email exists
    const contactEmail = ensureEmailOrThrow(payload);

    // 🔹 Prepare request body
    const body = {
      email_address: contactEmail,
      fields: mergeFields || {},
      tags: integration.config.tags || [],
      status: "subscribed",
    };

    try {
      // 🔸 Send subscriber to EmailOctopus
      const response = await fetch(
        `https://api.emailoctopus.com/lists/${listId}/contacts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
        }
      );

      const text = await response.text();
      let result: any = null;

      if (text) {
        try {
          result = JSON.parse(text);
        } catch {
          console.warn("⚠️ Non-JSON response from EmailOctopus:", text);
        }
      }

      if (!response.ok) {
        console.error("❌ EmailOctopus API error:", result || text);
        throw new Error(
          result?.message || `EmailOctopus request failed: ${response.status} ${response.statusText}`
        );
      }

      return result;
    } catch (error: any) {
      console.error("❌ EmailOctopus API call failed:", error);
      throw new Error(
        error.message || "Failed to send data to EmailOctopus."
      );
    }
  },
};
