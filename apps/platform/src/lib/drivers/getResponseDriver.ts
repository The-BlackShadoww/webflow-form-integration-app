// @ts-nocheck — ported from old backend; cleanup later
import { db } from "@/lib/db";
import { IntegrationRecord, IntegrationDriver } from "@/lib/drivers/types";
import { buildMergeFields } from "@/lib/integration-utils";
import { ensureEmailOrThrow } from "@/lib/integration-helpers/helper";
import { getValidGetResponseToken } from "@/lib/integration-helpers/getResponseToken";

export const getResponseDriver: IntegrationDriver = {
  send: async (
    integrationId: number,
    event: string,
    formId: string,
    payload: any,
    config: any,
    integration: IntegrationRecord,
  ) => {
    // 1. Find GetResponse credentials
    const integrationCredential = await db.integrationCredential.findUnique({
      where: { id: integration.credentialId },
    });

    if (!integrationCredential) {
      throw new Error("GetResponse credentials not found");
    }

    const accessToken = await getValidGetResponseToken(
      integrationCredential.id,
    );
    if (!accessToken) throw new Error("GetResponse access token missing");

    const email = ensureEmailOrThrow(payload);

    // 2. Build field map (your dynamic mapping system)
    const mergedFields = buildMergeFields(
      payload,
      integration.config.merge_fields,
    );

    // 3. Prepare GetResponse final payload
    const contactPayload: any = {
      email: email,
    };

    if (mergedFields.email || mergedFields.Email) {
      contactPayload.email = mergedFields.email || mergedFields.Email;
    }

    if (mergedFields.name || mergedFields.Name) {
      contactPayload.name = mergedFields.name || mergedFields.Name;
    }

    if (mergedFields.ipAddress) {
      contactPayload.ipAddress = mergedFields.ipAddress;
    }

    if (mergedFields.dayOfCycle) {
      contactPayload.dayOfCycle = mergedFields.dayOfCycle;
    }

    if (config.listId) {
      contactPayload.campaign = {
        campaignId: config.listId,
      };
    }

    // CUSTOM FIELDS (detect by prefix cf_) mergedFields.cf_nXaFUj -> lastname
    const customFieldValues = [];

    for (const key in mergedFields) {
      if (key.startsWith("cf_")) {
        const customFieldId = key.replace("cf_", "");
        const value = mergedFields[key];

        customFieldValues.push({
          customFieldId,
          value: Array.isArray(value) ? value : [value],
        });
      }
    }

    if (customFieldValues.length > 0) {
      contactPayload.customFieldValues = customFieldValues;
    }


    try {
      const response = await fetch("https://api.getresponse.com/v3/contacts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Domain": "app.getresponse.com",
        },
        body: JSON.stringify(contactPayload),
      });
      return;
    } catch (error: any) {
      console.error("❌ GetResponse API Error:", error.message);
      throw new Error(error.message || "Failed to send data to GetResponse");
    }
  },
};
