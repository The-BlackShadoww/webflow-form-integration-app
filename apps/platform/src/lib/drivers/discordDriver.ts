// @ts-nocheck — ported from old backend; cleanup later
import { db } from "@/lib/db";
import { IntegrationRecord, IntegrationDriver } from "@/lib/drivers/types";

export const discordDriver: IntegrationDriver = {
  send: async (
    integrationId: number,
    event: string,
    formId: string,
    payload: any,
    config: any,
    integration: IntegrationRecord
  ) => {

    const botToken = process.env.DISCORD_BOT_TOKEN;
    if (!botToken) {
      throw new Error("Discord Bot token missing in integration credentials.");
    }

    const channelId = integration.config.channelId;
    if (!channelId) {
      throw new Error("Discord channelId missing in integration config.");
    }

    const formattedMessage = Object.entries(payload)
      .map(([key, value]) => `**${key}:** ${value}`)
      .join("\n");

    const messageContent = `📩 **New Form Submission Received**\n\n${formattedMessage}`;

    try {
      const response = await fetch(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bot ${botToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: messageContent,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ Discord API error:", result);
        throw new Error(result.message || "Failed to send message to Discord.");
      }

      console.log("✅ Message sent to Discord channel:", result.id);
      return result;
    } catch (error: any) {
      console.error("❌ Discord driver failed:", error);
      throw new Error(error.message || "Discord message send failed.");
    }
  },
};
