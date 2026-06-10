// @ts-nocheck — ported from old backend; cleanup later
import { db } from "@/lib/db";
import { IntegrationRecord, IntegrationDriver } from "@/lib/drivers/types";
import { buildMergeFields } from "@/lib/integration-utils";
import axios from "axios";
import {getValidAirtableAccessToken} from "@/lib/integration-helpers/helper";

export const airtableDriver: IntegrationDriver = {
  send: async (
    integrationId: number,
    event: string,
    formId: string,
    payload: any,
    config: any,
    integration: IntegrationRecord,
  ) => {
    const integrationCredential = await db.integrationCredential.findUnique({
      where: { id: integration.credentialId },
    });

    if (!integrationCredential) {
      throw new Error("Airtable credentials not found");
    }

    const accessToken = integrationCredential.accessToken;
    const baseId = JSON.parse(integrationCredential.extraData as string).baseId;
    const tableId = integration.config.listId;

    if (!accessToken) throw new Error("Airtable access token missing");
    if (!baseId) throw new Error("Airtable baseId missing");
    if (!tableId) throw new Error("Airtable tableId missing");


    const { access_token, expires_in } = await getValidAirtableAccessToken({
      accessToken,
      refreshToken: integrationCredential.refreshToken,
      expiresAt: integrationCredential.expiresAt,
    });

    await db.integrationCredential.update({
      where: {
        id: integration.credentialId,
      },
      data: {
        accessToken: access_token,
        expiresAt: expires_in,
      },
    });


    // Build dynamic field data
    const buildMergeFieldsWithData = buildMergeFields(
      payload,
      integration.config.merge_fields,
    );

    // Prepare record payload
    const airtablePayload = {
      records: [
        {
          fields: buildMergeFieldsWithData,
        },
      ],
    };

    try {
      const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;

      const response = await axios.post(url, airtablePayload, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ Airtable record created:", response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        "❌ Airtable API error:",
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.error?.message ||
          "Failed to send data to Airtable",
      );
    }
  },
};
