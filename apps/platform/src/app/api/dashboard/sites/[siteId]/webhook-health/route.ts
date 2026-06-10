import { NextRequest, NextResponse } from "next/server";
import { WebflowClient } from "webflow-api";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/jwt";
import { env } from "@/lib/env";

export async function GET(req: NextRequest, ctx: { params: Promise<{ siteId: string }> }) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { siteId } = await ctx.params;

  const site = await db.site.findFirst({
    where: { siteId, dashboardUserId: auth.id },
    include: { user: true },
  });
  if (!site) return NextResponse.json({ message: "Site not found" }, { status: 404 });
  if (!site.user?.accessToken) return NextResponse.json({ message: "No Webflow token" }, { status: 400 });

  const client = new WebflowClient({ accessToken: site.user.accessToken });
  const expected = env.FORM_SUBMISSION_URL;

  try {
    const { webhooks = [] } = await client.webhooks.list(siteId);
    const ok = webhooks.some((w: any) => w.triggerType === "form_submission" && w.url === expected);
    return NextResponse.json({
      ok,
      expected,
      webhooks: webhooks.map((w: any) => ({ id: w.id, url: w.url, triggerType: w.triggerType })),
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, expected, webhooks: [], error: String(err?.message ?? err) }, { status: 200 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ siteId: string }> }) {
  // Re-register the webhook
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { siteId } = await ctx.params;
  const site = await db.site.findFirst({ where: { siteId, dashboardUserId: auth.id }, include: { user: true } });
  if (!site?.user?.accessToken) return NextResponse.json({ message: "No Webflow token" }, { status: 400 });
  const client = new WebflowClient({ accessToken: site.user.accessToken });
  await client.webhooks.create(siteId, { triggerType: "form_submission", url: env.FORM_SUBMISSION_URL } as any);
  return NextResponse.json({ ok: true });
}
