import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/jwt";
import { activateLicense, applyLicenseStatus, bindLicenseToSite } from "@/lib/license";

export async function POST(req: NextRequest, ctx: { params: Promise<{ siteId: string }> }) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { siteId } = await ctx.params;

  const site = await db.site.findFirst({ where: { siteId, dashboardUserId: auth.id } });
  if (!site) return NextResponse.json({ message: "Site not found" }, { status: 404 });

  const { key } = await req.json();
  if (!key) return NextResponse.json({ message: "Missing key" }, { status: 400 });

  try {
    const info = await activateLicense(siteId, key);
    if (info?.activated || info?.valid) {
      // Move the key to this site, releasing any previous site that held it
      await bindLicenseToSite(siteId, key);
      return NextResponse.json({ ok: true, info });
    }
    return NextResponse.json({ ok: false, message: "License not activated" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: String(err?.message ?? err) }, { status: 400 });
  }
}
