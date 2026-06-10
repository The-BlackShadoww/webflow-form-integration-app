import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/jwt";
import { MOCK_DESTINATIONS } from "@/lib/mock-providers";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import { providers, providerTypeValues } from "@/features/integrations/providers";

export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { provider } = await ctx.params;
  const credentialId = req.nextUrl.searchParams.get("credentialId");
  const meta = providers.find((p) => p.slug === provider);

  if (meta) {
    const cred = await db.integrationCredential.findFirst({
      where: {
        dashboardUserId: auth.id,
        type: { in: providerTypeValues(meta) },
        ...(credentialId ? { id: Number(credentialId) } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    if (cred) {
      try {
        const destinations = await fetchDestinations(provider, cred);
        if (destinations) return NextResponse.json({ destinations });
      } catch (e: any) {
        return NextResponse.json({ message: e?.message ?? "Provider fetch failed", destinations: [] }, { status: 502 });
      }
    }
  }

  if (env.MOCK_PROVIDERS) {
    return NextResponse.json({ destinations: MOCK_DESTINATIONS[provider] ?? [] });
  }
  return NextResponse.json({ destinations: [] });
}

async function fetchDestinations(slug: string, cred: { accessToken: string | null; apiKey: string | null }) {
  if (slug === "notion") {
    const token = cred.accessToken ?? cred.apiKey;
    if (!token) throw new Error("Notion token missing.");
    const res = await fetch("https://api.notion.com/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filter: { property: "object", value: "database" }, page_size: 100 }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? `Notion API ${res.status}`);
    return (data.results ?? []).map((d: any) => ({
      id: d.id,
      name: d.title?.[0]?.plain_text || "Untitled database",
    }));
  }
  return null; // signal fallback
}
