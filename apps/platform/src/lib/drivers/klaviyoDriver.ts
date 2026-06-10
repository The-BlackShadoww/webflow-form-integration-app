// @ts-nocheck — ported from old backend; cleanup later
import { db } from "@/lib/db";
import { IntegrationRecord, IntegrationDriver } from "@/lib/drivers/types";
import { ensureEmailOrThrow } from "@/lib/integration-helpers/helper";
import { buildMergeFields } from "@/lib/integration-utils";

export const klaviyoDriver: IntegrationDriver = {
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
      throw new Error("Klaviyo API key missing in integration credentials.");
    }

    const listId = integration.config.listId;
    if (!listId) {
      throw new Error("Klaviyo list ID is missing in integration config.");
    }


    const mergeFields = integration.config.merge_fields || {};

    const mergeFieldsWithData = buildMergeFields(payload, mergeFields);



    // 🔹 Ensure email exists
    const contactEmail = ensureEmailOrThrow(payload);

    // 🔹 Prepare request body for Klaviyo 2025 Bulk Profile Import API
    const body = {
      data: {
        type: "profile-bulk-import-job",
        attributes: {
          profiles: {
            data: [
              {
                type: "profile",
                attributes: {
                  email: contactEmail,
                  ...mergeFieldsWithData
                },
              },
            ],
          },
        },
        relationships: {
          lists: {
            data: [
              {
                type: "list",
                id: listId,
              },
            ],
          },
        },
      },
    };

    try {
      // 🔸 Send subscriber to Klaviyo
      const response = await fetch(
        "https://a.klaviyo.com/api/profile-bulk-import-jobs",
        {
          method: "POST",
          headers: {
            accept: "application/vnd.api+json",
            revision: "2025-10-15",
            Authorization: `Klaviyo-API-Key ${apiKey}`,
            "Content-Type": "application/json",
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
          console.warn("⚠️ Non-JSON response from Klaviyo:", text);
        }
      }

      if (!response.ok) {
        console.error("❌ Klaviyo API error:", result || text);
        throw new Error(
          result?.errors?.[0]?.detail || `Klaviyo request failed: ${response.status} ${response.statusText}`
        );
      }
      return
    } catch (error: any) {
      console.error("❌ Klaviyo API call failed:", error);
      throw new Error(
        error.message || "Failed to send data to Klaviyo."
      );
    }
  },
};
