// @ts-nocheck — ported from old backend; cleanup later
import axios from "axios";
import { IntegrationRecord, IntegrationDriver } from "@/lib/drivers/types";
import { buildMergeFields } from "@/lib/integration-utils";
import { hubspotController } from "@/lib/integration-helpers/hubspotToken";

export const hubspotDriver: IntegrationDriver = {
  send: async (
    integrationId: number,
    event: string,
    formId: string,
    payload: any,
    config: any,
    integration: IntegrationRecord,
  ) => {


    const accessToken = await hubspotController.getValidAccessToken(
      "",
      integration.credentialId,
    );

    const buildMergeFieldsWithData = buildMergeFields(
      payload,
      integration.config.properties,
    );
    console.log("buildMergeFieldsWithData", {
      properties: buildMergeFieldsWithData,
    });
    try {
      // 🚀 Create contact
      const contactRes = await axios.post(
        "https://api.hubapi.com/crm/v3/objects/contacts",
        JSON.stringify({ properties: buildMergeFieldsWithData }),

        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      const contactId = contactRes.data.id;

      // ✅ Optional: add to list
      if (integration.config.listId) {
        try {
          await axios.post(
            `https://api.hubapi.com/crm/v3/lists/${integration.config.listId}/memberships/add`,
            { objectIds: [contactId] },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            },
          );
        } catch (v3Err: any) {
          console.warn("v3 list failed, falling back to v1");

          await axios.post(
            `https://api.hubapi.com/contacts/v1/lists/${integration.config.listId}/add`,
            { vids: [parseInt(contactId)] },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            },
          );
        }
      }

      console.log("✅ HubSpot contact created:", contactId);
    } catch (error: any) {
      console.error("❌ HubSpot error:", error.response?.data || error.message);
      throw new Error(
        error.response?.data?.message || "Failed to create contact in HubSpot.",
      );
    }
  },
};
