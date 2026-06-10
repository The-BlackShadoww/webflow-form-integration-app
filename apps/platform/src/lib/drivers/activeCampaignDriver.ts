// @ts-nocheck — ported from old backend; cleanup later
import { db } from "@/lib/db";
import { IntegrationRecord, IntegrationDriver } from "@/lib/drivers/types";
import { buildMergeFields } from "@/lib/integration-utils";
import { ensureEmailOrThrow } from "@/lib/integration-helpers/helper";

export const activeCampaignDriver: IntegrationDriver = {
  send: async (
    integrationId: number,
    event: string,
    formId: string,
    payload: any,
    config: any,
    integration: IntegrationRecord,
  ) => {
    const integrationCredential = await db.integrationCredential.findUnique({
      where: { id: integration.credentialId as number },
    });

    if (!integrationCredential) {
      throw new Error("Integration credential not found");
    }

    const apiKey = integrationCredential.apiKey;
    const baseUrl = integrationCredential.url;

    if (!apiKey) {
      throw new Error(
        "ActiveCampaign API key missing in integration credentials.",
      );
    }
    if (!baseUrl) {
      throw new Error(
        "ActiveCampaign base URL missing in integration credentials.",
      );
    }

    // 🔹 Merge fields mapping
    const buildMergeFieldsWithData = buildMergeFields(
      payload,
      integration.config.merge_fields,
    );

    // 🔹 Ensure email exists
    const contactEmail =  ensureEmailOrThrow(payload);

    // 🔹 Prepare field values
    const fieldValues = Object.entries(buildMergeFieldsWithData).map(
      ([key, value]) => ({
        field: key,
        value: value,
      }),
    );

    // 🔹 Prepare contact payload
    const contactBody = {
      contact: {
        email: contactEmail,
        firstName: buildMergeFieldsWithData.firstName || "",
        lastName: buildMergeFieldsWithData.lastName || "",
        phone: buildMergeFieldsWithData.phone || "",
        fieldValues,
      },
    };

    try {
      // 🔸 Sync contact (creates or updates)
      const response = await fetch(`${baseUrl}/api/3/contact/sync`, {
        method: "POST",
        headers: {
          "Api-Token": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(contactBody),
      });

      // Parse response
      let result: any = null;
      const text = await response.text();
      if (text) {
        try {
          result = JSON.parse(text);
        } catch {
          console.warn("⚠️ Non-JSON response from ActiveCampaign:", text);
        }
      }

      if (!response.ok) {
        console.error("❌ ActiveCampaign API error:", result || text);
        throw new Error(
          result?.message ||
            result?.errors?.[0]?.title ||
            `ActiveCampaign request failed: ${response.status} ${response.statusText}`,
        );
      }

      // 🔸 Subscribe the contact to a list (if provided)
      if (integration.config.listId && result?.contact?.id) {
        try {
          await fetch(`${baseUrl}/api/3/contactLists`, {
            method: "POST",
            headers: {
              "Api-Token": apiKey,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              contactList: {
                list: integration.config.listId,
                contact: result.contact.id,
                status: 1, // 1 = active subscriber
              },
            }),
          });
        } catch (err) {
          console.warn("⚠️ Failed to subscribe contact to list:", err);
        }
      }

      return result;
    } catch (error: any) {
      console.error("❌ ActiveCampaign API call failed:", error);
      throw new Error(
        error.message || "Failed to send data to ActiveCampaign.",
      );
    }
  },
};
