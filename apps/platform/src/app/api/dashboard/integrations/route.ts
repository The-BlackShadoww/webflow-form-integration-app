import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const sites = await db.site.findMany({
    where: { dashboardUserId: auth.id },
    select: { siteId: true, displayName: true },
  });
  const siteIds = sites.map((s) => s.siteId);
  if (siteIds.length === 0) return NextResponse.json({ integrations: [] });
  const integrations = await db.globalIntegration.findMany({
    where: { siteId: { in: siteIds } },
    include: { credential: true },
    orderBy: { createdAt: "desc" },
  });
  const siteMap = new Map(sites.map((s) => [s.siteId, s.displayName]));
  return NextResponse.json({
    integrations: integrations.map((i) => ({
      ...i,
      siteName: siteMap.get(i.siteId) ?? null,
    })),
  });
}

// Site-scoped integrations subroute lives at /sites/[siteId]/integrations
