// @ts-nocheck — ported from old backend; cleanup later
import { google } from "googleapis";
import { db } from "@/lib/db";
import axios from "axios";
import qs from "qs";
import {
  DropdownOption,
  EmailOctopusApiResponse,
  TransformedEmailOctopus,
  TransformedFields,
} from "@/lib/drivers/types";

export function cleanMergeFields(fields: Record<string, any>) {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === "undefined" || value === "") {
      cleaned[key] = null;
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// ---------- Brevo Helper ----------
export const brevoFetch = async <T>(
  endpoint: string,
  apiKey: string,
  options: RequestInit = {},
): Promise<T> => {
  const res = await fetch(`https://api.brevo.com/v3${endpoint}`, {
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(
      `Brevo API Error: ${res.status} ${res.statusText} - ${errText}`,
    );
  }

  return (await res.json()) as T;
};

// Google Auth Helper

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!; // Example: https://yourapp.com/integrations/google/callback

/**
 * Returns a valid Google access token.
 * Automatically refreshes and updates DB if expired.
 */
export const getValidGoogleAccessToken = async (
  credentialId: number,
): Promise<string> => {
  // 1️⃣ Get saved integration data
  const integration = await db.integrationCredential.findUnique({
    where: { id: credentialId },
  });

  if (!integration) {
    throw new Error("Integration credential not found");
  }

  const { accessToken, refreshToken, expiresAt } = integration;
  if (!refreshToken) {
    throw new Error("Missing Google refresh token");
  }

  // 2️⃣ Check token validity
  const now = Math.floor(Date.now() / 1000);
  const isExpired = !expiresAt || now >= expiresAt;

  if (!isExpired && accessToken) {
    return accessToken;
  }

  // 3️⃣ Refresh if expired
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error("Failed to refresh Google access token");
    }

    const newExpiry = credentials.expiry_date
      ? Math.floor(credentials.expiry_date / 1000)
      : now + 3600; // fallback to 1hr

    // 4️⃣ Update DB
    await db.integrationCredential.update({
      where: { id: credentialId },
      data: {
        accessToken: credentials.access_token,
        expiresAt: newExpiry,
        updatedAt: new Date(),
      },
    });

    console.log(
      `🔄 Access token refreshed for Google credentialId=${credentialId}`,
    );

    return credentials.access_token;
  } catch (error: any) {
    console.error("❌ Error refreshing Google access token:", error);
    throw new Error(error.message || "Failed to refresh Google access token");
  }
};

const authHeader = Buffer.from(
  `${process.env.AIRTABLE_CLIENT_ID}:${process.env.AIRTABLE_CLIENT_SECRET}`,
).toString("base64");

interface AirtableField {
  id: string;
  name: string;
  type: string;
}

interface AirtableTable {
  id: string;
  name: string;
  fields: AirtableField[];
}

interface MappedData {
  tablesArray: { label: string; value: string }[];
  fieldsArray: {
    tableId: string;
    fields: { label: string; value: string }[];
  }[];
}

export const mapAirtableData = (fetchTables: AirtableTable[]): MappedData => {
  // Map table list
  const tablesArray = fetchTables.map((table) => ({
    label: table.name,
    value: table.id,
  }));

  // Map fields by table
  const fieldsArray = fetchTables.map((table) => ({
    tableId: table.id,
    fields: table.fields.map((field) => ({
      label: field.name,
      value: field.name,
    })),
  }));

  return { tablesArray, fieldsArray };
};

const AIRTABLE_TOKEN_URL = "https://airtable.com/oauth2/v1/token";

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // timestamp in ms
}

/**
 * Get valid Airtable access token
 */

export const getValidAirtableAccessToken = async (tokenData: TokenData) => {
  const nowSec = Math.floor(Date.now() / 1000);

  // Token still valid? (with 5 sec buffer)
  if (tokenData.expiresAt > nowSec + 5) {
    return {
      access_token: tokenData.accessToken,
      expires_in: tokenData.expiresAt - nowSec, // seconds left
    };
  }

  // Token expired → refresh
  const data = qs.stringify({
    grant_type: "refresh_token",
    refresh_token: tokenData.refreshToken,
  });

  const response = await axios.post(AIRTABLE_TOKEN_URL, data, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${authHeader}`,
    },
  });

  const { access_token, expires_in, refresh_token } = response.data;

  // Update local token data
  tokenData.accessToken = access_token;
  tokenData.refreshToken = refresh_token || tokenData.refreshToken;
  tokenData.expiresAt = nowSec + expires_in;

  return {
    access_token,
    expires_in,
  };
};

// Moonsend
export const transformFields = (
  mappingObject: Record<string, string>,
  dataObject: Record<string, any>,
): {
  topLevelFields: Record<string, any>;
  customFields: { Name: string; Value: any }[];
} => {
  const topLevelFields: Record<string, any> = {};
  const customFields: { Name: string; Value: any }[] = [];

  Object.entries(mappingObject).forEach(([key, mapValue]) => {
    const actualValue = dataObject[mapValue] ?? ""; // Get the value if there is a match

    if (key.startsWith("custom_")) {
      // custom field → prefix remove
      const cleanKey = key.replace(/^custom_/, "");
      customFields.push({ Name: cleanKey, Value: actualValue });
    } else {
      // top-level field
      topLevelFields[key] = actualValue;
    }
  });

  return { topLevelFields, customFields };
};

export const ensureEmailOrThrow = (payload: Record<string, any>): string => {
  const emailKey = Object.keys(payload).find(
    (key) =>
      key.toLowerCase().includes("email") &&
      typeof payload[key] === "string" &&
      payload[key].includes("@"),
  );

  if (emailKey) {
    payload.email = payload[emailKey].trim();
    return payload.email;
  }

  throw new Error("No valid email property found in payload");
};

//Constant Contact

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
}

/**
 * Check if access token is valid
 * @param accessToken Current access token
 * @param expiresAt Expiry time in unix seconds
 * @param refreshToken Refresh token
 * @returns { accessToken, expiresAt, refreshToken }
 */
export const getValidAccessToken = async (
  accessToken: string,
  expiresAt: number,
  refreshToken: string,
  integrationId: number,
): Promise<{
  accessToken: string;
  expiresAt: number;
  refreshToken: string;
}> => {
  const now = Math.floor(Date.now() / 1000);

  // Valid token → return directly
  if (accessToken && expiresAt > now) {
    return { accessToken, expiresAt, refreshToken };
  }

  // Expired → fetch new token
  const clientId = process.env.CC_CLIENT_ID;
  const clientSecret = process.env.CC_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Constant Contact client ID or secret is not configured in environment variables.",
    );
  }

  const res = await axios.post<TokenResponse>(
    "https://authz.constantcontact.com/oauth2/default/v1/token",
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  const data = res.data;
  const newAccessToken = data.access_token;
  const newRefreshToken = data.refresh_token;
  const newExpiresAt = Math.floor(Date.now() / 1000) + data.expires_in;

  await db.integrationCredential.update({
    where: { id: integrationId },
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt: newExpiresAt,
    },
  });

  return {
    accessToken: newAccessToken,
    expiresAt: newExpiresAt,
    refreshToken: newRefreshToken,
  };
};

export const transformEmailOctopusData = (
  data: EmailOctopusApiResponse,
): TransformedEmailOctopus => {
  const lists: DropdownOption[] = data.data.map((list) => ({
    label: list.name,
    value: list.id,
  }));

  const fields: TransformedFields[] = data.data.map((list) => ({
    listId: list.id,
    fields: list.fields.map((field) => ({
      label: field.label,
      value: field.tag,
    })),
  }));

  return { lists, fields };
};


// Get Credential by credential id
export const getCredentialOrThrow = async (credentialId?: string | number) => {
  if (!credentialId) {
    throw new Error("Missing credentialId");
  }

  const id =
    typeof credentialId === "string" ? parseInt(credentialId, 10) : credentialId;

  if (isNaN(id)) {
    throw new Error("Invalid credentialId");
  }

  const credential = await db.integrationCredential.findUnique({
    where: { id },
  });

  if (!credential) {
    throw new Error("Credential not found");
  }

  return credential;
};
