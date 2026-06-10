import { NextRequest, NextResponse } from "next/server";
import { WebflowClient } from "webflow-api";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/jwt";

export async function GET(req: NextRequest, ctx: { params: Promise<{ siteId: string }> }) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { siteId } = await ctx.params;
  const site = await db.site.findFirst({
    where: { siteId, dashboardUserId: auth.id },
    include: { user: true },
  });
  if (!site || !site.user) return NextResponse.json({ message: "Site not found" }, { status: 404 });
  const client = new WebflowClient({ accessToken: site.user.accessToken });
  try {
    const [{ forms = [] }, siteMeta] = await Promise.all([
      client.forms.list(siteId),
      client.sites.get(siteId).catch(() => null as any),
    ]);

    const shortName = (siteMeta as any)?.shortName;
    const publishDomain =
      (siteMeta as any)?.customDomains?.[0]?.url ??
      (shortName ? `https://${shortName}.webflow.io` : null);
    const designerDomain = shortName ? `https://${shortName}.design.webflow.com` : null;

    const pageIds = Array.from(new Set(forms.map((f: any) => f.pageId).filter(Boolean)));
    const pages = await Promise.all(
      pageIds.map((id) => client.pages.getMetadata(id as string).catch(() => null as any)),
    );
    const pageById = new Map<string, any>(
      pages.filter((p) => !!p).map((p: any) => [p.id, p]),
    );

    const enriched = forms.map((f: any) => {
      const page = pageById.get(f.pageId);
      // publishedPath already includes folder hierarchy ("/form-integration/demo");
      // fall back to leaf slug only if publishedPath is missing.
      const path = page?.publishedPath ?? (page?.slug ? `/${page.slug}` : "");
      const pageUrl =
        publishDomain && path
          ? `${String(publishDomain).replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`
          : null;
      const designerUrl =
        designerDomain && f.pageId
          ? `${designerDomain}/?pageId=${f.pageId}`
          : null;
      return { ...f, pageUrl, designerUrl, pagePath: path || null };
    });

    return NextResponse.json({ forms: enriched });
  } catch (err: any) {
    // Webflow returns 404 when the stored access token can no longer see this site
    // (token revoked, app uninstalled on the site, or workspace moved). Return a clean
    // 200 with a reconnect hint so the UI can prompt instead of showing a 502 toast.
    const msg = String(err?.message ?? err);
    const isLostAccess = err?.statusCode === 404 || /404|not found|site cannot be found/i.test(msg);
    if (isLostAccess) {
      return NextResponse.json({
        forms: [],
        needsReconnect: true,
        message: "Webflow no longer recognizes this site for the connected account. Reconnect Webflow to restore access.",
      });
    }
    return NextResponse.json({ message: "Failed to fetch forms", error: msg }, { status: 502 });
  }
}
