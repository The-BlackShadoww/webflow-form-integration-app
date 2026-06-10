// @ts-nocheck — ported from old backend; cleanup later
// export const buildMergeFields = (
//   data: Record<string, any>,
//   mergeFieldMap: Record<string, string>,
// ) => {
//   const merge_fields: Record<string, any> = {};
//
//   for (const [mergeTag, dataKey] of Object.entries(mergeFieldMap)) {
//     if (data[dataKey] !== undefined) {
//       merge_fields[mergeTag] = data[dataKey];
//     }
//   }
//
//   return merge_fields;
// };


export const buildMergeFields = (
    data: Record<string, any>,
    mergeFieldMap: Record<string, string>,
) => {
  const merge_fields: Record<string, any> = {};

  for (const [mergeTag, dataKey] of Object.entries(mergeFieldMap)) {
    const value = data[dataKey];

    // Skip if undefined, null, empty string, or empty object
    if (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "") ||
        (typeof value === "object" && Object.keys(value).length === 0)
    ) {
      continue;
    }

    merge_fields[mergeTag] = value;
  }

  return merge_fields;
};

/**
 * Bridges the new dashboard config shape:
 *   { destinationId, fieldMapping: [{ webflowField, providerField }] }
 * to the legacy driver shape expected by the ported drivers:
 *   { listId | channelId | databaseId | spreadsheetId, merge_fields | properties: { providerField: webflowField } }
 *
 * Existing legacy keys are preserved; aliases are only filled in when absent.
 */
export function normalizeIntegrationConfig(config: any): any {
  const c = { ...(config ?? {}) };

  const destinationId = c.destinationId ?? c.listId ?? c.channelId ?? c.databaseId ?? c.spreadsheetId;
  if (destinationId) {
    if (c.listId == null) c.listId = destinationId;
    if (c.channelId == null) c.channelId = destinationId;
    if (c.databaseId == null) c.databaseId = destinationId;
    if (c.spreadsheetId == null) c.spreadsheetId = destinationId;
    if (c.destinationId == null) c.destinationId = destinationId;
  }

  const hasLegacyMap =
    (c.merge_fields && Object.keys(c.merge_fields).length) ||
    (c.properties && Object.keys(c.properties).length);

  if (!hasLegacyMap && Array.isArray(c.fieldMapping)) {
    const mfMap: Record<string, string> = {};
    for (const m of c.fieldMapping) {
      if (m?.providerField && m?.webflowField) mfMap[m.providerField] = m.webflowField;
    }
    if (Object.keys(mfMap).length) {
      if (!c.merge_fields) c.merge_fields = mfMap;
      if (!c.properties) c.properties = mfMap;
    }
  }

  return c;
}

export function toBoolean(value: any): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
}