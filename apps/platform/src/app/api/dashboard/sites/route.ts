import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const sites = await db.site.findMany({
    where: { dashboardUserId: auth.id },
    select: {
      id: true,
      siteId: true,
      displayName: true,
      previewUrl: true,
      workspaceId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const siteIds = sites.map((s) => s.siteId);
  const integrations = siteIds.length
    ? await db.globalIntegration.findMany({
        where: { siteId: { in: siteIds }, isActive: true },
        select: { siteId: true, type: true },
        distinct: ["siteId", "type"],
      })
    : [];

  const bySite = integrations.reduce<Record<string, string[]>>((acc, g) => {
    (acc[g.siteId] ??= []).push(g.type);
    return acc;
  }, {});

  return NextResponse.json({
    sites: sites.map((s) => ({ ...s, integrations: bySite[s.siteId] ?? [] })),
  });
}
