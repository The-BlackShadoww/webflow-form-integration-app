import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/jwt";
import { env } from "@/lib/env";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ siteId: string; formId: string }> },
) {
  const auth = requireAuth(req);
  if (!auth)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { siteId, formId } = await ctx.params;
  const site = await db.site.findFirst({
    where: { siteId, dashboardUserId: auth.id },
  });
  if (!site)
    return NextResponse.json({ message: "Site not found" }, { status: 404 });
  const mappings = await db.globalIntegration.findMany({
    where: { siteId, formId },
    include: { credential: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ mappings });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ siteId: string; formId: string }> },
) {
  const auth = requireAuth(req);
  if (!auth)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { siteId, formId } = await ctx.params;
  const { credentialId, pageId, formElementId, type, integrationName, config } =
    await req.json();
  const site = await db.site.findFirst({
    where: { siteId, dashboardUserId: auth.id },
  });
  if (!site)
    return NextResponse.json({ message: "Site not found" }, { status: 404 });
  const licensed =
    site.licenseStatus === "active" || site.licenseStatus === "trial";
  if (!env.DEV_BYPASS_LICENSE && !licensed) {
    return NextResponse.json(
      { message: "Site is not licensed for integrations" },
      { status: 403 },
    );
  }
  const credential = await db.integrationCredential.findFirst({
    where: { id: credentialId, dashboardUserId: auth.id },
  });
  if (!credential)
    return NextResponse.json(
      { message: "Credential not found" },
      { status: 404 },
    );
  const existing = await db.globalIntegration.findFirst({
    where: { siteId, formId },
  });
  if (existing)
    return NextResponse.json(
      { message: "This form already has a mapping — edit or remove it first." },
      { status: 409 },
    );
  const mapping = await db.globalIntegration.create({
    data: {
      siteId,
      formId,
      formElementId: formElementId ?? null,
      pageId: pageId ?? "",
      type,
      integrationName: integrationName ?? credential.connectionName,
      credentialId,
      config,
    },
    include: { credential: true },
  });
  return NextResponse.json({ mapping }, { status: 201 });
}
