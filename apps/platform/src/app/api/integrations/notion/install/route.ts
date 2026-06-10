import { NextRequest, NextResponse } from "next/server";
import { signOauthState, verifyToken } from "@/lib/jwt";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userToken = url.searchParams.get("token");
  const name = url.searchParams.get("name") ?? "Notion";

  if (!userToken)
    return NextResponse.json({ message: "Missing token" }, { status: 401 });
  const auth = verifyToken(userToken);
  if (!auth)
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  if (!env.NOTION_CLIENT_ID || !env.NOTION_REDIRECT_URI) {
    return NextResponse.json(
      { message: "Notion OAuth not configured" },
      { status: 500 },
    );
  }

  const state = signOauthState({ userId: auth.id, name, provider: "notion" });
  const params = new URLSearchParams({
    client_id: env.NOTION_CLIENT_ID,
    redirect_uri: env.NOTION_REDIRECT_URI,
    response_type: "code",
    owner: "user",
    state,
  });
  return NextResponse.redirect(
    `https://api.notion.com/v1/oauth/authorize?${params}`,
  );
}
