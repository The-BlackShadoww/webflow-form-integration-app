// @ts-nocheck — ported from old backend; cleanup later
import { db } from "@/lib/db";
import { IntegrationRecord, IntegrationDriver } from "@/lib/drivers/types";
import { buildMergeFields } from "@/lib/integration-utils";

export const mailerLiteDriver: IntegrationDriver = {
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
      throw new Error("MailerLite API key missing in integration credentials.");
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
      fields: buildMergeFieldsWithData,
      groups: [integration.config.listId],
    };

    try {
      const response = await fetch("https://connect.mailerlite.com/api/subscribers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(contactBody),
      });

      let result: any = null;
      const text = await response.text();
      if (text) {
        try {
          result = JSON.parse(text);
        } catch (jsonErr) {
          console.warn("⚠️ Non-JSON response from MailerLite:", text);
        }
      }

      if (!response.ok) {
        console.error("❌ MailerLite API error:", result || text);
        throw new Error(
          result?.message ||
          result?.error ||
          `MailerLite request failed: ${response.status} ${response.statusText}`
        );
      }

      console.log("✅ MailerLite contact created/updated");
      return result;
    } catch (error: any) {
      console.error("❌ MailerLite API call failed:", error);
      throw new Error(error.message || "Failed to send data to MailerLite.");
    }
  },
};
