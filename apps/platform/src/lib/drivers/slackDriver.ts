// @ts-nocheck — ported from old backend; cleanup later

import { IntegrationRecord, IntegrationDriver } from "@/lib/drivers/types";
import { db } from "@/lib/db";

export const slackDriver: IntegrationDriver = {
  send: async (
    integrationId: number,
    event: string,
    formId: string,
    payload: any,
    config: any,
    integration: IntegrationRecord,
  ) => {
    // Fetch integration credentials (OAuth access token)
    const integrationCredential = await db.integrationCredential.findUnique({
      where: { id: integration.credentialId },
    });

    if (!integrationCredential) {
      throw new Error("Slack OAuth credentials not found.");
    }

    const accessToken = integrationCredential.accessToken ?? integrationCredential.apiKey;
    const channelId = integration.config.channelId;

    if (!accessToken) {
      throw new Error("Missing Slack token (OAuth access token or bot token).");
    }

    if (!channelId) {
      throw new Error("Missing Slack channel ID.");
    }

    // Prepare message
    const messageText = `New form submission for ${formId}`;
    const blocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*New Form Submission*\nEvent: ${event}\nForm ID: ${formId}`,
        },
      },
      {
        type: "section",
        fields: Object.entries(payload).map(([key, value]) => ({
          type: "mrkdwn",
          text: `*${key}:*\n${String(value)}`,
        })),
      },
    ];

    try {
      // Send message via Slack Web API
      const response = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          channel: channelId,
          text: messageText,
          blocks,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Slack API error: ${data.error}`);
      }

      console.log("✅ Slack message sent successfully:", data.ts);
    } catch (error: any) {
      console.error("❌ Slack send failed:", error);
      throw new Error(error.message || "Failed to send Slack message.");
    }
  },
};
