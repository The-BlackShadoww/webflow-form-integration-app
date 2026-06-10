import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/jwt";

const SAMPLE = {
  test: true,
  source: "flowappz-form-integration",
  fields: { Name: "Test User", Email: "test@example.com", Message: "Hello from Flowappz" },
  submittedAt: new Date().toISOString(),
};

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const cred = await db.integrationCredential.findFirst({
    where: { id: Number(id), dashboardUserId: auth.id },
  });
  if (!cred) return NextResponse.json({ message: "Credential not found" }, { status: 404 });

  // Caller may pass `siteId` to scope the resulting log row to the current site page.
  const body = await req.json().catch(() => ({}));
  const ctxSiteId: string | undefined = typeof body?.siteId === "string" ? body.siteId : undefined;
  const logSiteId = ctxSiteId || cred.siteId || "(test)";

  if (cred.type !== "webhook" || !cred.url) {
    return NextResponse.json({
      ok: false,
      mocked: true,
      message: `Test is only supported for webhook URLs. Submit a form to verify ${cred.type}.`,
    }, { status: 400 });
  }

  try {
    const res = await fetch(cred.url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-flowappz-test": "1" },
      body: JSON.stringify(SAMPLE),
    });
    const ok = res.ok;
    await db.integrationLog.create({
      data: {
        siteId: logSiteId,
        formId: "(test)",
        integrationType: cred.type,
        status: ok ? "success" : "failed",
        message: `Test POST → ${cred.url} returned ${res.status}`,
        dashboardUserId: cred.dashboardUserId,
      },
    });
    return NextResponse.json({ ok, status: res.status });
  } catch (err: any) {
    await db.integrationLog.create({
      data: {
        siteId: logSiteId,
        formId: "(test)",
        integrationType: cred.type,
        status: "failed",
        message: `Test POST failed: ${String(err?.message ?? err)}`,
        dashboardUserId: cred.dashboardUserId,
      },
    });
    return NextResponse.json({ ok: false, error: String(err?.message ?? err) }, { status: 200 });
  }
}
