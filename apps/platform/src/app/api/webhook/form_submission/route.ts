import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebflowSignature } from "@/lib/verify-webflow";
import { env } from "@/lib/env";
import { getDriver } from "@/lib/drivers";
import { normalizeIntegrationConfig } from "@/lib/integration-utils";
import { devLog, devWarn } from "@/lib/devlog";

/**
 * Webflow form_submission webhook.
 *
 * Canonical v2 payload:
 *   {
 *     triggerType: "form_submission",
 *     payload: { formId, siteId, data: {...}, schema: [...], submittedAt }
 *   }
 *
 * Webflow signs deliveries with HMAC-SHA256 over `${timestamp}:${rawBody}`.
 * We always return 200 — failure to dispatch should not trigger Webflow retries (3× / 10min);
 * we log the failure to `IntegrationLog` and let the user retry via the dashboard.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Signature verification — gated to prod-ish envs; in dev we skip
  if (env.NODE_ENV === "production") {
    const sig = req.headers.get("x-webflow-signature");
    const ts = req.headers.get("x-webflow-timestamp");
    const ok = verifyWebflowSignature(
      rawBody,
      sig,
      ts,
      env.WEBFLOW_CLIENT_SECRET,
    );
    devLog("[webhook] signature check", {
      hasSig: !!sig,
      hasTs: !!ts,
      ok,
      bodyLen: rawBody.length,
      headers: Object.fromEntries(req.headers.entries()),
    });
    if (!ok) {
      devWarn("[webhook] signature rejected");
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 401 },
      );
    }
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const payload = body?.payload ?? {};
  const formId: string | undefined = payload.formId;
  const siteId: string | undefined = payload.siteId;
  const formElementId: string | undefined = payload.formElementId;
  const data: Record<string, any> | undefined = payload.data;
  const schema:
    | Array<{ fieldName: string; fieldType?: string; fieldElementId?: string }>
    | undefined = payload.schema;
  const idempotencyHint: string | undefined =
    payload.idempotencyHint ?? payload.submissionId ?? body?.id;

  if (idempotencyHint) {
    const dup = await db.integrationLog
      .findUnique({ where: { idempotencyKey: `inbound:${idempotencyHint}` } })
      .catch(() => null);
    if (dup) {
      console.info(
        `[webhook] duplicate dropped — idempotencyHint=${idempotencyHint}`,
      );
      return NextResponse.json({ ok: true, deduplicated: true });
    }
  }

  // Resolve owner from the Site row so logs surface in the dashboard
  const siteRow = siteId
    ? await db.site
        .findUnique({ where: { siteId }, select: { dashboardUserId: true } })
        .catch(() => null)
    : null;
  const dashboardUserId = siteRow?.dashboardUserId ?? null;

  // Log every inbound webhook so we can debug — including misses
  await db.integrationLog
    .create({
      data: {
        siteId: siteId ?? "(unknown)",
        formId: formId ?? "(missing)",
        integrationType: "_inbound",
        status: "received",
        message: `payload keys: ${Object.keys(payload ?? {}).join(",") || "(empty)"}; data: ${JSON.stringify(data ?? {}).slice(0, 240)}`,
        idempotencyKey: idempotencyHint ? `inbound:${idempotencyHint}` : null,
        dashboardUserId,
      },
    })
    .catch(() => {});

  if (!formId) {
    console.warn("[webhook] missing formId in payload");
    return NextResponse.json({ message: "Missing formId" }, { status: 200 });
  }

  // Match by formId first; fall back to (siteId, formElementId) so any duplicate
  // (Webflow Component used on multiple pages) auto-dispatches when ONE duplicate is mapped.
  let mappings = await db.globalIntegration.findMany({
    where: { formId, isActive: true },
    include: { credential: true },
  });
  if (mappings.length === 0 && siteId && formElementId) {
    mappings = await db.globalIntegration.findMany({
      where: { siteId, formElementId, isActive: true },
      include: { credential: true },
    });
  }

  if (mappings.length === 0) {
    console.info(`[webhook] no mapping for formId=${formId}`);
    return NextResponse.json(
      { message: "No integrations found" },
      { status: 200 },
    );
  }

  // Dispatch to per-provider drivers. We always return 200 to Webflow;
  // per-mapping success/failure is recorded in IntegrationLog.
  const results = await Promise.allSettled(
    mappings.map(async (m) => {
      const driver = getDriver(m.type);
      if (!driver) {
        await db.integrationLog.create({
          data: {
            siteId: m.siteId,
            formId: m.formId,
            integrationType: m.type,
            dashboardUserId,
            status: "pending",
            message: "Driver not wired yet (OAuth providers pending)",
          },
        });
        return { type: m.type, status: "pending" as const };
      }
      try {
        const normalizedConfig = normalizeIntegrationConfig(m.config);
        await driver.send(
          m.id,
          "form_submission",
          m.formId,
          { ...(data ?? {}), siteId, formId },
          normalizedConfig,
          { ...m, config: normalizedConfig } as any,
        );
        await db.integrationLog.create({
          data: {
            siteId: m.siteId,
            formId: m.formId,
            integrationType: m.type,
            dashboardUserId,
            status: "success",
            message: `Delivered via ${m.type}`,
          },
        });
        await db.globalIntegration.update({
          where: { id: m.id },
          data: { lastSuccess: new Date(), lastError: null },
        });
        return { type: m.type, status: "success" as const };
      } catch (err: any) {
        const msg = String(err?.message ?? err).slice(0, 480);
        await db.integrationLog.create({
          data: {
            siteId: m.siteId,
            formId: m.formId,
            integrationType: m.type,
            dashboardUserId,
            status: "failed",
            message: msg,
          },
        });
        await db.globalIntegration.update({
          where: { id: m.id },
          data: { lastError: msg },
        });
        return { type: m.type, status: "failed" as const };
      }
    }),
  );

  const dispatched = results.length;
  return NextResponse.json({
    ok: true,
    dispatched,
    fieldCount: data ? Object.keys(data).length : 0,
    schema: schema?.length ?? 0,
  });
}
