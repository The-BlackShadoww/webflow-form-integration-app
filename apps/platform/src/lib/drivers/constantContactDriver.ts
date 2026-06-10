// @ts-nocheck — ported from old backend; cleanup later
import { db } from "@/lib/db";
import { IntegrationRecord, IntegrationDriver } from "@/lib/drivers/types";
import { ensureEmailOrThrow, getValidAccessToken } from "@/lib/integration-helpers/helper";

export const constantContactDriver: IntegrationDriver = {
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
      throw new Error("Integration credentials not found");
    }
    const { accessToken, refreshToken, expiresAt, id } = integrationCredential;
    if (!accessToken || !refreshToken || !expiresAt) {
      throw new Error("Constant Contact credentials are incomplete. Please reconnect the integration.");
    }
    const tokenData = await getValidAccessToken(accessToken, expiresAt, refreshToken, id);

    const mergeFields = integration.config.merge_fields || {};
    const listId = integration.config.listId;
    if (!listId) throw new Error("Constant Contact list ID missing");

    const email = ensureEmailOrThrow(payload);

    const body: any = {
      email_address: email,
      list_memberships: [listId],
    };
    const custom_fields: any[] = [];

    // loop through merge_fields mapping
    for (const [fieldKey, formFieldName] of Object.entries(mergeFields)) {
      const value = payload[formFieldName as string];
      if (value === undefined || value === null) continue;

      if (fieldKey.startsWith("cf_")) {
        // Custom field
        custom_fields.push({
          custom_field_id: fieldKey.replace("cf_", ""),
          value,
        });
      }  else {
        body[fieldKey] = value;
      }
    }

    if (custom_fields.length > 0) body.custom_fields = custom_fields;

    try {
      const response = await fetch(
        "https://api.cc.email/v3/contacts/sign_up_form",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenData.accessToken}`,
          },
          body: JSON.stringify(body),
        },
      );

      const text = await response.text();
      let result: any = null;
      if (text) {
        try {
          result = JSON.parse(text);
        } catch {
          console.warn("Non-JSON response:", text);
        }
      }

      if (!response.ok) {
        console.error("Constant Contact API error:", result || text);
        throw new Error(
          result?.error_message || `Request failed: ${response.status}`,
        );
      }

      console.log("✅ Contact created/updated:", result);
      return result;
    } catch (err: any) {
      console.error("Constant Contact API call failed:", err);
      throw new Error(err.message || "Failed to send data to Constant Contact");
    }
  },
};
