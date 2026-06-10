// @ts-nocheck — ported from old backend; cleanup later
import { db } from "@/lib/db";
import { IntegrationRecord, IntegrationDriver } from "@/lib/drivers/types";
import { buildMergeFields } from "@/lib/integration-utils";
import { google } from "googleapis";
import { getValidGoogleAccessToken } from "@/lib/integration-helpers/helper";

export const googleSheetDriver: IntegrationDriver = {
  send: async (
    integrationId: number,
    event: string,
    formId: string,
    payload: any,
    config: any,
    integration: IntegrationRecord
  ) => {

    const integrationCredential = await db.integrationCredential.findUnique({
      where: { id: integration.credentialId },
    });

    if (!integrationCredential) {
      throw new Error("Google integration credentials not found.");
    }

    console.log("integreation info" , integration)

    // 2️⃣ Get valid access token (auto refresh if expired)
    const accessToken = await getValidGoogleAccessToken(integration.credentialId);


    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const sheets = google.sheets({ version: "v4", auth });


    const buildMergeFieldsWithData = buildMergeFields(
      payload,
      integration.config.merge_fields
    );

    const rowValues = Object.values(buildMergeFieldsWithData);

    const meta = await sheets.spreadsheets.get({
      spreadsheetId: integration.config.listId,
    });
    const firstSheet = meta.data.sheets?.[0]?.properties?.title;

    if (!firstSheet) {
      throw new Error("No sheet found in the spreadsheet.");
    }

    // 6️⃣ Append data
    try {
      const response = await sheets.spreadsheets.values.append({
        spreadsheetId: integration.config.listId,
        range: firstSheet,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [rowValues],
        },
      });

      console.log("✅ Data appended to Google Sheet:", response.data.updates);
    } catch (error: any) {
      console.error("❌ Google Sheets append failed:", error);
      throw new Error(error.message || "Failed to send data to Google Sheet.");
    }
  },
};
