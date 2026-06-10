import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { env } from "@/lib/env";
import {
  exchangeCodeForAccessToken,
  syncSitesAndWebhooks,
} from "@/lib/webflow";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");
  if (error) {
    console.warn("[webflow] OAuth error:", error);
    return NextResponse.json(
      { message: "You didn't authorize the app." },
      { status: 400 },
    );
  }
  if (!code)
    return NextResponse.json({ message: "Missing code" }, { status: 400 });

  const accessToken = await exchangeCodeForAccessToken(code);

  let dashboardUserId: number | undefined;
  if (state) {
    const payload = verifyToken(state);
    if (payload) dashboardUserId = payload.id;
  }

  try {
    await syncSitesAndWebhooks(accessToken, dashboardUserId);
  } catch (err) {
    console.error("[webflow] sync failed", err);
    return NextResponse.json(
      { message: "Sync failed", error: String(err) },
      { status: 500 },
    );
  }

  if (dashboardUserId) {
    return NextResponse.redirect(`${env.DASHBOARD_URL}/sites?connected=true`);
  }
  return NextResponse.redirect("https://webflow.com/dashboard");
}
