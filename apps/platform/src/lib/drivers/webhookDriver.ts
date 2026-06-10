// @ts-nocheck — ported from old backend; cleanup later
import { IntegrationType, IntegrationDriver, IntegrationRecord } from "@/lib/drivers/types";
import { db } from "@/lib/db";
import { validateUrlSecurity } from "@/lib/url-security";


export const webhookDriver: IntegrationDriver = {
  send: async (
    integrationId: number,
    event: string,
    formId: string,
    payload: any,
    config: any,
    integration: IntegrationRecord,
  ) => {


    const newconfig = await db.integrationCredential.findUnique({
      where: { id: integration.credentialId as number },
    });

    if (!newconfig) {
      throw new Error("Config not found");
    }
    const { url, apiKey } = newconfig;

    if (!url) throw new Error("Missing webhook URL");


    const ip = await validateUrlSecurity(url);
    const parsedUrl = new URL(url);
    const originalHostname = parsedUrl.hostname;
    const isHttps = parsedUrl.protocol === "https:";
    // HTTPS must keep the hostname in the URL so TLS SNI and cert checks use that name
    // (Host header does not change TLS peer verification). SSRF: validateUrlSecurity
    // still resolves the hostname and rejects private IPs before we fetch.
    const fetchUrl = isHttps ? url : (() => {
      const u = new URL(url);
      u.hostname = ip;
      return u.toString();
    })();

    const response = await fetch(fetchUrl, {
      method: "POST",
      headers: {
        ...(isHttps ? {} : { Host: originalHostname }),
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({ event, formId, payload }),
    });


  },
};
