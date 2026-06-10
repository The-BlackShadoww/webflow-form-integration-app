import { env } from "@/lib/env";
import { db } from "@/lib/db";

export type LicenseInfo = {
  appName?: string;
  siteId?: string;
  valid: boolean;
  createdAt?: string;
  expireAt?: string;
  key?: string;
  activated?: string | null;
};

const adminBase = () => env.ADMIN_API_BASE_URL.replace(/\/$/, "");

/** Derive the per-site activation key the upstream admin expects (mirrors plugin's btoa(siteId)). */
export const deriveLicenseKey = (siteId: string) => Buffer.from(siteId).toString("base64");

/** Fetch license validity from the upstream admin server. */
export async function fetchLicense(siteId: string): Promise<LicenseInfo> {
  if (env.DEV_BYPASS_LICENSE) {
    return { valid: true, siteId, appName: env.APP_NAME };
  }
  const url = `${adminBase()}/api/licenses/validate?siteId=${encodeURIComponent(siteId)}&appName=${encodeURIComponent(env.APP_NAME)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const text = await res.text();
  if (!res.ok) throw new Error(`Admin /validate ${res.status}: ${text.slice(0, 200)}`);
  // Admin sometimes returns a JSON-encoded string body (matches plugin's `JSON.parse(data)`).
  try {
    const first = JSON.parse(text);
    return typeof first === "string" ? JSON.parse(first) : first;
  } catch {
    return { valid: false };
  }
}

export async function activateLicense(siteId: string, key: string): Promise<LicenseInfo> {
  if (env.DEV_BYPASS_LICENSE) {
    return { valid: true, siteId, appName: env.APP_NAME, key, activated: new Date().toISOString() };
  }
  const res = await fetch(`${adminBase()}/api/licenses/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ appName: env.APP_NAME, siteId, key }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) throw new Error(data?.error ?? `Admin /activate ${res.status}`);
  return data;
}

export async function deactivateLicense(siteId: string, key: string): Promise<LicenseInfo> {
  if (env.DEV_BYPASS_LICENSE) {
    return { valid: false, siteId, appName: env.APP_NAME };
  }
  const res = await fetch(`${adminBase()}/api/licenses/deactivate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ appName: env.APP_NAME, siteId, key }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.error) throw new Error(data?.error ?? `Admin /deactivate ${res.status}`);
  return data;
}

/** Apply a license-status change locally: flip Site.licenseStatus + toggle GlobalIntegration.isActive. */
export async function applyLicenseStatus(siteId: string, isActive: boolean) {
  await db.site.updateMany({
    where: { siteId },
    data: {
      licenseStatus: isActive ? "active" : "inactive",
      ...(isActive ? {} : { licenseKey: null }),
    },
  });
  await db.globalIntegration.updateMany({ where: { siteId }, data: { isActive } });
}

/**
 * Bind a license key to a site, releasing it from any other site that previously held it.
 * Mirrors the ai-seo-boost pattern so a single license key only stays active on ONE site:
 * activating it elsewhere clears the old site's licenseStatus.
 */
export async function bindLicenseToSite(siteId: string, key: string) {
  const previous = await db.site.findMany({
    where: { licenseKey: key, siteId: { not: siteId } },
    select: { siteId: true },
  });
  for (const p of previous) {
    await db.site.update({
      where: { siteId: p.siteId },
      data: { licenseStatus: "inactive", licenseKey: null },
    });
    await db.globalIntegration.updateMany({
      where: { siteId: p.siteId },
      data: { isActive: false },
    });
  }
  await db.site.updateMany({
    where: { siteId },
    data: { licenseStatus: "active", licenseKey: key },
  });
  await db.globalIntegration.updateMany({ where: { siteId }, data: { isActive: true } });
}
