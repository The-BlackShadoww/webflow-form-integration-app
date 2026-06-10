import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/jwt";

export async function GET(req: NextRequest, ctx: { params: Promise<{ siteId: string }> }) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { siteId } = await ctx.params;
  const site = await db.site.findFirst({ where: { siteId, dashboardUserId: auth.id } });
  if (!site) return NextResponse.json({ message: "Site not found" }, { status: 404 });
  const integrations = await db.globalIntegration.findMany({
    where: { siteId },
    include: { credential: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ integrations });
}
