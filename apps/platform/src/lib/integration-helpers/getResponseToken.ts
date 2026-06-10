// @ts-nocheck — ported from old backend; cleanup later
import { db } from "@/lib/db";

/**
 * Check if token is expired using updatedAt + expiresIn.
 */
function isTokenExpired(updatedAt: Date, expiresInSec: number): boolean {
  const issuedAt = updatedAt.getTime();
  const now = Date.now();
  const expiresAt = issuedAt + expiresInSec * 1000;

  // 30 sec buffer for safety
  return now + 30_000 >= expiresAt;
}

/**
 * Refresh GetResponse OAuth token
 */
async function refreshGetResponseToken(refreshToken: string) {


  const clientId = process.env.GETRESPONSE_CLIENT_ID;
  const clientSecret = process.env.GETRESPONSE_CLIENT_SECRET;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://api.getresponse.com/v3/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken
    })
  });

  if (!res.ok) {
    const body = await res.json();
    console.error("Refresh token failed:", body);
    throw new Error("Failed to refresh GetResponse token");
  }

  return res.json();
}

/**
 * MAIN FUNCTION:
 * - Check token expiry
 * - Refresh if expired
 * - Save updated token
 * - Return valid access token
 */
export async function getValidGetResponseToken(credentialId: number) {
  const credential = await db.integrationCredential.findUnique({
    where: { id: credentialId }
  });

  if (!credential) {
    throw new Error("GetResponse credential not found");
  }

  const {
    accessToken,
    refreshToken,
    expiresAt,
    updatedAt,
  } = credential;


  if (!isTokenExpired(updatedAt, expiresAt)) {
    return accessToken;
  }

  const data = await refreshGetResponseToken(refreshToken);

  await db.integrationCredential.update({
    where: { id: credentialId },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in
    }
  });

  return data.access_token;
}
