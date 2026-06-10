// @ts-nocheck — ported from old backend; cleanup later

import { db } from "@/lib/db";
import { IntegrationRecord, IntegrationDriver } from "@/lib/drivers/types";
import { buildMergeFields } from "@/lib/integration-utils";
import axios from "axios";
import { ensureEmailOrThrow } from "@/lib/integration-helpers/helper";

export const senderDriver: IntegrationDriver = {
  send: async (
    _integrationId: number,
    _event: string,
    _formId: string,
    payload: any,
    _config: any,
    integration: IntegrationRecord,
  ) => {
    const integrationCredential = await db.integrationCredential.findUnique({
      where: { id: integration.credentialId as number },
    });
    if (!integrationCredential) {
      throw new Error("Sender credentials not found");
    }

    const apiKey = integrationCredential.apiKey;
    const groupId = integration.config.listId;
    if (!apiKey) throw new Error("Sender API Key missing");
    if (!groupId) throw new Error("Sender groupId missing");

    const rawMerge = buildMergeFields(payload, integration.config.merge_fields);
    const email = ensureEmailOrThrow(payload);

    // Separate default fields vs custom fields
    const subscriberData: Record<string, any> = {
      email,
      groups: [groupId],
      trigger_automation: false,
    };

    const customFields: Record<string, any> = {};

    for (const [key, value] of Object.entries(rawMerge)) {
      // Suppose you have a way to know which keys are custom vs standard.
      // For example, integration.config.merge_fields metadata might tell.
      const isCustom = key.startsWith("cf_"); // Or another logic from your config

      if (isCustom) {
        // remove cf_ prefix to get the custom field name
        const cleanKey = key.replace(/^cf_/, "");
        customFields[cleanKey] = value;
      } else {
        subscriberData[key] = value;
      }
    }

    if (Object.keys(customFields).length > 0) {
      subscriberData.fields = customFields;
    }


    try {
      const url = "https://api.sender.net/v2/subscribers";
      const response = await axios.post(url, subscriberData, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      console.log("✅ Subscriber created:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Sender API error:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to send to Sender"
      );
    }
  },
};
