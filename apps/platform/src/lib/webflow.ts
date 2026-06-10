import { WebflowClient } from "webflow-api";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

/**
 * Exchange OAuth code for an access token via Webflow's helper.
 */
export const exchangeCodeForAccessToken = async (code: string): Promise<string> => {
  return WebflowClient.getAccessToken({
    clientId: env.WEBFLOW_CLIENT_ID,
    clientSecret: env.WEBFLOW_CLIENT_SECRET,
    code,
  });
};

/**
 * Fetch sites for the freshly-authorized user, persist them, link to the dashboard user,
 * and register the form-submission webhook on each site.
 */
export const syncSitesAndWebhooks = async (accessToken: string, dashboardUserId?: number) => {
  const client = new WebflowClient({ accessToken });
  const webflowUser = await client.token.authorizedBy();
  const { sites = [] } = await client.sites.list();

  // Upsert the Webflow user row (one User per Webflow account)
  const user = await db.user.upsert({
    where: { webflowUserId: String(webflowUser.id) },
    create: {
      webflowUserId: String(webflowUser.id),
      email: webflowUser.email ?? "",
      firstName: webflowUser.firstName ?? "",
      lastName: webflowUser.lastName ?? "",
      accessToken,
    },
    update: { accessToken, email: webflowUser.email ?? "", firstName: webflowUser.firstName ?? "", lastName: webflowUser.lastName ?? "" },
  });

  // Upsert each site. If ownership is changing (a different dashboardUser is syncing
  // a site already owned by someone else), reset the license fields — the new owner
  // must re-activate. Prevents a paid license from silently following site reassignment.
  for (const s of sites) {
    const existing = await db.site.findUnique({
      where: { siteId: s.id },
      select: { dashboardUserId: true, licenseStatus: true },
    });
    const ownershipChanging =
      !!existing &&
      !!dashboardUserId &&
      existing.dashboardUserId != null &&
      existing.dashboardUserId !== dashboardUserId;

    await db.site.upsert({
      where: { siteId: s.id },
      create: {
        siteId: s.id,
        workspaceId: s.workspaceId ?? "",
        displayName: s.displayName ?? s.shortName ?? s.id,
        previewUrl: s.previewUrl ?? null,
        userId: user.id,
        dashboardUserId: dashboardUserId ?? null,
      },
      update: {
        displayName: s.displayName ?? s.shortName ?? s.id,
        previewUrl: s.previewUrl ?? null,
        userId: user.id,
        ...(dashboardUserId ? { dashboardUserId } : {}),
        ...(ownershipChanging
          ? { licenseStatus: "inactive", licenseKey: null }
          : {}),
      },
    });

    if (ownershipChanging) {
      await db.globalIntegration.updateMany({
        where: { siteId: s.id },
        data: { isActive: false },
      });
    }
  }

  // Register form-submission webhook on each site if not already present
  const webhookUrl = env.FORM_SUBMISSION_URL;
  for (const s of sites) {
    try {
      const existing = await client.webhooks.list(s.id);
      const already = existing.webhooks?.some(
        (w: any) => w.triggerType === "form_submission" && w.url === webhookUrl,
      );
      if (!already) {
        // v2: siteId is implicit in the path, workspaceId no longer required
        await client.webhooks.create(s.id, {
          triggerType: "form_submission",
          url: webhookUrl,
        } as any);
      }
    } catch (err) {
      console.warn(`[webflow] webhook setup failed for site ${s.id}`, err);
    }
  }
};
