import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const siteFilter = url.searchParams.get("siteId");
  const statusFilter = url.searchParams.get("status");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "200", 10) || 200, 500);

  const ownedSiteIds = (
    await db.site.findMany({ where: { dashboardUserId: auth.id }, select: { siteId: true } })
  ).map((s) => s.siteId);

  // Owner-scoped: include rows tagged with this user's id (covers test pings + future
  // generic logs) AND any rows for sites they own (covers legacy rows written before
  // dashboardUserId was added). siteId filter narrows to one site.
  const ownerOrs: any[] = [{ dashboardUserId: auth.id }];
  if (ownedSiteIds.length) ownerOrs.push({ siteId: { in: ownedSiteIds } });

  const logs = await db.integrationLog.findMany({
    where: {
      AND: [
        { OR: ownerOrs },
        ...(siteFilter ? [{ siteId: siteFilter }] : []),
        ...(statusFilter ? [{ status: statusFilter }] : []),
      ] as any,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ logs });
}
