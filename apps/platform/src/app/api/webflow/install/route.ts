import { NextRequest, NextResponse } from "next/server";
import { WebflowClient } from "webflow-api";
import { OauthScope } from "webflow-api/api/types/OAuthScope";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get("state") ?? undefined;
  const authorizeUrl = WebflowClient.authorizeURL({
    scope: env.WEBFLOW_SCOPES.split(",") as OauthScope[],
    clientId: env.WEBFLOW_CLIENT_ID,
    state,
  });
  return NextResponse.redirect(authorizeUrl);
}
