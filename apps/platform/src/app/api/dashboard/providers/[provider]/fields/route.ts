import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/jwt";
import { MOCK_FIELDS, channelOnlyFields } from "@/lib/mock-providers";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import {
  providers,
  providerTypeValues,
} from "@/features/integrations/providers";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> },
) {
  const auth = requireAuth(req);
  if (!auth)
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { provider } = await ctx.params;
  const destinationId = req.nextUrl.searchParams.get("destinationId");
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
        const fields = await fetchFields(provider, cred, destinationId);
        if (fields) return NextResponse.json({ fields });
      } catch (e: any) {
        return NextResponse.json(
          { message: e?.message ?? "Provider fetch failed", fields: [] },
          { status: 502 },
        );
      }
    }
  }

  if (env.MOCK_PROVIDERS) {
    if (provider === "slack")
      return NextResponse.json({ fields: channelOnlyFields("Slack") });
    if (provider === "discord")
      return NextResponse.json({ fields: channelOnlyFields("Discord") });
    return NextResponse.json({
      fields: MOCK_FIELDS[provider] ?? [
        { id: "email", name: "Email" },
        { id: "name", name: "Name" },
      ],
    });
  }

  return NextResponse.json({
    fields: [
      { id: "email", name: "Email" },
      { id: "name", name: "Name" },
    ],
  });
}

async function fetchFields(
  slug: string,
  cred: { accessToken: string | null; apiKey: string | null },
  destinationId: string | null,
) {
  if (slug === "notion") {
    if (!destinationId) return null;
    const token = cred.accessToken ?? cred.apiKey;
    if (!token) throw new Error("Notion token missing.");
    const res = await fetch(
      `https://api.notion.com/v1/databases/${destinationId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
        },
      },
    );
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message ?? `Notion API ${res.status}`);
    const props = data.properties ?? {};
    return Object.entries(props).map(([name, p]: [string, any]) => {
      const type = p?.type ?? "unknown";
      return {
        id: name,
        name,
        type,
        supported: NOTION_WRITABLE_TYPES.has(type),
      };
    });
  }
  return null;
}

// Notion property types we can write to from a form submission.
// Excludes computed/system (formula, rollup, created_time, last_edited_time, unique_id, etc.)
// and types that need IDs from the user's workspace (people, relation).
const NOTION_WRITABLE_TYPES = new Set([
  "title",
  "rich_text",
  "number",
  "select",
  "multi_select",
  "status",
  "date",
  "checkbox",
  "email",
  "phone_number",
  "url",
  "files",
]);
