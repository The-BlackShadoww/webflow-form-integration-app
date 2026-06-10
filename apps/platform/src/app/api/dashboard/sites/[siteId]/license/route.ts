import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/jwt";
import { env } from "@/lib/env";
import { applyLicenseStatus, deriveLicenseKey, fetchLicense } from "@/lib/license";

export async function GET(req: NextRequest, ctx: { params: Promise<{ siteId: string }> }) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { siteId } = await ctx.params;

  const site = await db.site.findFirst({ where: { siteId, dashboardUserId: auth.id } });
  if (!site) return NextResponse.json({ licensed: false, status: "not_found" }, { status: 404 });

  if (env.DEV_BYPASS_LICENSE) {
    return NextResponse.json({ licensed: true, bypass: true, status: "bypass", key: deriveLicenseKey(siteId) });
  }

  // Consult the upstream admin server and keep our local Site.licenseStatus in sync.
  let info: any = { valid: site.licenseStatus === "active" };
  try {
    info = await fetchLicense(siteId);
  } catch (err) {
    console.warn("[license] fetch failed for", siteId, err);
  }
  const desired = info.valid ? "active" : "inactive";
  if (site.licenseStatus !== desired) await applyLicenseStatus(siteId, info.valid);

  return NextResponse.json({
    licensed: !!info.valid,
    status: desired,
    key: info.key ?? deriveLicenseKey(siteId),
    activated: info.activated ?? null,
    expireAt: info.expireAt ?? null,
    activationUrl: `${env.ADMIN_API_BASE_URL.replace(/\/$/, "")}/dashboard/${env.APP_NAME}/websites?new_site=true&token=${encodeURIComponent(deriveLicenseKey(siteId))}`,
  });
}
