import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/jwt";
import { syncSitesAndWebhooks } from "@/lib/webflow";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const sites = await db.site.findMany({
    where: { dashboardUserId: auth.id },
    include: { user: true },
  });

  const tokens = new Set<string>();
  for (const s of sites) {
    if (s.user?.accessToken) tokens.add(s.user.accessToken);
  }

  if (tokens.size === 0) {
    return NextResponse.json({ message: "Connect Webflow first", synced: 0 }, { status: 400 });
  }

  for (const token of tokens) {
    try {
      await syncSitesAndWebhooks(token, auth.id);
    } catch (err) {
      console.warn("[sync] failed for one token", err);
    }
  }

  const synced = await db.site.count({ where: { dashboardUserId: auth.id } });
  return NextResponse.json({ synced });
}
