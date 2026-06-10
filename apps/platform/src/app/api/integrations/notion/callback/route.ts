import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyOauthState } from "@/lib/jwt";
import { env } from "@/lib/env";
import { closeOauthPopup } from "@/lib/oauth-popup";

const closePopup = (msg: string, ok: boolean) =>
  closeOauthPopup("notion", ok, msg);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return closePopup("Missing code or state", false);

  const decoded = verifyOauthState(state);
  if (!decoded || decoded.provider !== "notion")
    return closePopup("Invalid state", false);

  if (
    !env.NOTION_CLIENT_ID ||
    !env.NOTION_CLIENT_SECRET ||
    !env.NOTION_REDIRECT_URI
  ) {
    return closePopup("Notion OAuth not configured", false);
  }

  const basic = Buffer.from(
    `${env.NOTION_CLIENT_ID}:${env.NOTION_CLIENT_SECRET}`,
  ).toString("base64");

  try {
    const res = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: env.NOTION_REDIRECT_URI,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data?.access_token) {
      return closePopup(
        data?.error_description ??
          data?.error ??
          `Token exchange failed (${res.status})`,
        false,
      );
    }

    await db.integrationCredential.create({
      data: {
        siteId: "",
        type: "NOTIONCONNECTION",
        connectionName: decoded.name,
        accessToken: data.access_token,
        extraData: {
          botId: data.bot_id,
          workspaceId: data.workspace_id,
          workspaceName: data.workspace_name,
          owner: data.owner,
        },
        dashboardUserId: decoded.userId,
      },
    });

    return closePopup(`Connected to ${data.workspace_name ?? "Notion"}`, true);
  } catch (err: any) {
    return closePopup(String(err?.message ?? err), false);
  }
}
