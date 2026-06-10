// @ts-nocheck — ported from old backend; cleanup later
import qs from "qs";
import axios from "axios";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

const expiresInToEpochMs = (seconds: number) => Date.now() + seconds * 1000;

const normalizeExpiry = (expiresAt) => {
  if (!expiresAt) return 0;
  if (expiresAt < 1_000_000_000) return 0;
  if (expiresAt < 10_000_000_000) return expiresAt * 1000;
  return expiresAt;
};

const refresh = async (refreshToken: string) => {
  const payload = {
    grant_type: "refresh_token",
    client_id: env.HUBSPOT_CLIENT_ID,
    client_secret: env.HUBSPOT_CLIENT_SECRET,
    refresh_token: refreshToken,
  };
  const res = await axios.post(
    "https://api.hubapi.com/oauth/v1/token",
    qs.stringify(payload),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
  );
  return {
    accessToken: res.data.access_token,
    refreshToken: res.data.refresh_token || refreshToken,
    expiresAt: expiresInToEpochMs(res.data.expires_in),
  };
};

export const hubspotController = {
  async getValidAccessToken(_config: any, credentialId: number): Promise<string> {
    const cred = await db.integrationCredential.findUnique({ where: { id: credentialId } });
    if (!cred) throw new Error("HubSpot credential not found");

    const expiresAtMs = normalizeExpiry(cred.expiresAt as any);
    let { accessToken, refreshToken } = cred;

    if (!accessToken || !expiresAtMs || Date.now() > expiresAtMs - 5 * 60 * 1000) {
      if (!refreshToken) throw new Error("Missing HubSpot refresh token");
      const fresh = await refresh(refreshToken);
      accessToken = fresh.accessToken;
      await db.integrationCredential.update({
        where: { id: credentialId },
        data: { accessToken: fresh.accessToken, refreshToken: fresh.refreshToken, expiresAt: fresh.expiresAt },
      });
    }
    return accessToken as string;
  },
};
