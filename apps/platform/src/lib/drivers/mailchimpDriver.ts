// @ts-nocheck — ported from old backend; cleanup later
import axios from "axios";
import { IntegrationRecord, IntegrationDriver } from "@/lib/drivers/types";
import {buildMergeFields} from "@/lib/integration-utils";
import {db} from "@/lib/db";
import { ensureEmailOrThrow } from "@/lib/integration-helpers/helper";

export const mailchimpDriver: IntegrationDriver = {
    send: async (
        integrationId: number,
        event: string,
        formId: string,
        payload: any,
        config: any,
        integration: IntegrationRecord,
    ) => {
        const integrationCredential = await db.integrationCredential.findUnique({
            where: {id: integration.credentialId as number},
        });

        if (!integrationCredential) {
            throw new Error("Config not found");
        }

        console.log("integrationCredential", integration.config.merge_fields);

        const buildMergeFieldsWithData = buildMergeFields(
            payload,
            integration.config.merge_fields,
        );

        const dc = integrationCredential.apiKey.split("-")[1];
        if (!dc) {
            throw new Error("Invalid Mailchimp API key format.");
        }

        const mailchimpUrl = `https://${dc}.api.mailchimp.com/3.0/lists/${integration.config.listId}/members`;
      const email =  ensureEmailOrThrow(payload);
        try {
            const response = await axios.post(
                mailchimpUrl,
                JSON.stringify({
                    email_address: email,
                    status: "subscribed",
                    merge_fields: buildMergeFieldsWithData,
                    tags: ["form_submission"],
                }),
                {
                    auth: {
                        username: "flowappz", // Mailchimp ignores username
                        password: integrationCredential.apiKey,
                    },
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                },
            );
        } catch (error: any) {
            console.error(
                "Mailchimp API error:",
                error.response?.data || error.message,
            );

            throw new Error(
                error.response?.data?.detail ||
                "Failed to add subscriber to Mailchimp.",
            );
        }
    },
};
