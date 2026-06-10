import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/jwt";
import { applyLicenseStatus, deactivateLicense, deriveLicenseKey } from "@/lib/license";

export async function POST(req: NextRequest, ctx: { params: Promise<{ siteId: string }> }) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { siteId } = await ctx.params;

  const site = await db.site.findFirst({ where: { siteId, dashboardUserId: auth.id } });
  if (!site) return NextResponse.json({ message: "Site not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const key = body?.key ?? deriveLicenseKey(siteId);

  try {
    await deactivateLicense(siteId, key);
  } catch (err) {
    // even if upstream fails, flip locally so the user can re-activate cleanly
    console.warn("[license] upstream deactivate failed", err);
  }
  await applyLicenseStatus(siteId, false);
  return NextResponse.json({ ok: true });
}
