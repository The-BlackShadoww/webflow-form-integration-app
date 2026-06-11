// @ts-nocheck — ported from old backend; cleanup later
import { db } from "@/lib/db";
import { IntegrationDriver, IntegrationRecord } from "@/lib/drivers/types";
import { buildMergeFields } from "@/lib/integration-utils";
import axios from "axios";

const NOTION_SCHEMA_CACHE_TTL_MS = 5 * 60 * 1000;
const notionSchemaCache = new Map<
  string,
  { schema: Record<string, any>; expiresAt: number }
>();

const getCachedNotionSchema = async (
  cacheKey: string,
  databaseId: string,
  notionToken: string,
  notionVersion: string,
) => {
  const now = Date.now();
  const cached = notionSchemaCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return cached.schema;
  }

  const dbRes = await axios.get(
    `https://api.notion.com/v1/databases/${databaseId}`,
    {
      headers: {
        Authorization: `Bearer ${notionToken}`,
        "Notion-Version": notionVersion,
      },
    },
  );

  const schema = dbRes.data.properties || {};

  notionSchemaCache.set(cacheKey, {
    schema,
    expiresAt: now + NOTION_SCHEMA_CACHE_TTL_MS,
  });

  return schema;
};

const cleanData = (data: Record<string, any>) => {
  return Object.keys(data).map((key) => {
    const parts = key.split("__");
    return {
      type: parts[0],
      notionColumnName: parts[1],
      formField: data[key],
    };
  });
};

export const notionDriver: IntegrationDriver = {
  send: async (
    integrationId: number,
    event: string,
    formId: string,
    payload: Record<string, any>,
    config: any,
    integration: IntegrationRecord,
  ) => {
    const integrationCredential = await db.integrationCredential.findUnique({
      where: { id: integration.credentialId },
    });
    if (!integrationCredential) throw new Error("Notion config not found");

    const databaseId =
      integration.config.databaseId ?? integration.config.destinationId;
    if (!databaseId) throw new Error("Notion databaseId is missing in config.");

    const notionToken =
      integrationCredential.accessToken ?? integrationCredential.apiKey;
    if (!notionToken)
      throw new Error(
        "Notion token missing (OAuth access token or integration API key).",
      );
    const notionVersion = "2022-06-28";
    const schemaCacheKey = `${integrationCredential.id}:${databaseId}`;

    // Build [{ notionColumnName, formField }] from the available config shapes:
    //   1. New: integration.config.fieldMapping = [{ webflowField, providerField }]
    //   2. Legacy A: integration.config.merge_fields with "<type>__<col>": webflowField keys
    //   3. Legacy B: integration.config.merge_fields with "<col>": webflowField keys (no type prefix)
    let rowMergeFields: Array<{ notionColumnName: string; formField: string }> =
      [];

    if (
      Array.isArray(integration.config.fieldMapping) &&
      integration.config.fieldMapping.length
    ) {
      rowMergeFields = integration.config.fieldMapping
        .filter((m: any) => m?.providerField && m?.webflowField)
        .map((m: any) => ({
          notionColumnName: m.providerField,
          formField: m.webflowField,
        }));
    } else if (
      integration.config.merge_fields &&
      Object.keys(integration.config.merge_fields).length
    ) {
      rowMergeFields = cleanData(integration.config.merge_fields).map(
        (r: any) => ({
          notionColumnName: r.notionColumnName ?? r.type, // fallback when key had no "__" prefix
          formField: r.formField,
        }),
      );
    }

    const mergeFieldsConfig: Record<string, string> = rowMergeFields.reduce(
      (acc: Record<string, string>, r) => {
        acc[r.notionColumnName] = r.formField;
        return acc;
      },
      {},
    );
    const merged = buildMergeFields(payload, mergeFieldsConfig);

    try {
      const schema = await getCachedNotionSchema(
        schemaCacheKey,
        databaseId,
        notionToken,
        notionVersion,
      );
      const properties: Record<string, any> = {};

      const textObj = (str: any) => [
        { type: "text", text: { content: String(str ?? "") } },
      ];

      for (const field of rowMergeFields) {
        const { notionColumnName, formField } = field;

        const value = merged[formField] ?? payload[formField];

        if (value === undefined || value === null || value === "") continue;

        const propSchema = schema[notionColumnName];
        if (!propSchema) {
          console.warn(`⚠️ Notion column "${notionColumnName}" not found`);
          continue;
        }

        switch (propSchema.type) {
          case "title":
            properties[notionColumnName] = { title: textObj(value) };
            break;
          case "rich_text":
            properties[notionColumnName] = { rich_text: textObj(value) };
            break;
          case "number":
            properties[notionColumnName] = { number: Number(value) };
            break;
          case "select":
            properties[notionColumnName] = { select: { name: String(value) } };
            break;
          case "multi_select":
            const arr = Array.isArray(value)
              ? value
              : String(value)
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean);
            properties[notionColumnName] = {
              multi_select: arr.map((v: string) => ({ name: v })),
            };
            break;
          case "date":
            try {
              properties[notionColumnName] = {
                date: { start: new Date(value).toISOString() },
              };
            } catch {
              console.warn(`⚠️ Invalid date for ${notionColumnName}`);
            }
            break;
          case "checkbox":
            properties[notionColumnName] = {
              checkbox: value === true || value === "true" || value === "on",
            };
            break;
          case "email":
            properties[notionColumnName] = { email: String(value) };
            break;
          case "phone_number":
            properties[notionColumnName] = { phone_number: String(value) };
            break;
          case "url":
            properties[notionColumnName] = { url: String(value) };
            break;
          case "status":
            properties[notionColumnName] = { status: { name: String(value) } };
            break;
          case "files":
            // Accept a single URL or comma-separated URLs
            const fileUrls = Array.isArray(value)
              ? value
              : String(value)
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean);
            properties[notionColumnName] = {
              files: fileUrls.map((u: string) => ({
                type: "external",
                name: u.split("/").pop() || "file",
                external: { url: u },
              })),
            };
            break;
          default:
            console.warn(
              `⚠️ Unhandled Notion property type: ${propSchema.type} for column ${notionColumnName}`,
            );
            break;
        }
      }

      let titleKey = Object.keys(schema).find(
        (key) => schema[key].type === "title",
      );
      if (titleKey && !properties[titleKey]) {
        properties[titleKey] = {
          title: textObj(
            payload.name || payload.email || "New Form Submission",
          ),
        };
      }

      console.log(
        "🚀 Sending Properties to Notion:",
        JSON.stringify(properties, null, 2),
      );

      const res = await axios.post(
        "https://api.notion.com/v1/pages",
        {
          parent: { database_id: databaseId },
          properties,
        },
        {
          headers: {
            Authorization: `Bearer ${notionToken}`,
            "Content-Type": "application/json",
            "Notion-Version": notionVersion,
          },
        },
      );

      return res.data;
    } catch (err: any) {
      console.error(
        "❌ Notion API Error Details:",
        err.response?.data || err.message,
      );
      throw new Error(
        err.response?.data?.message || "Failed to send data to Notion",
      );
    }
  },
};
