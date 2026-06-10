import { NextResponse } from "next/server";

export function closeOauthPopup(provider: string, ok: boolean, message: string) {
  const payload = JSON.stringify({ source: "flowappz-oauth", provider, ok, message });
  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:system-ui;padding:32px;text-align:center;">
      <h2>${ok ? "Connected" : "Failed"}</h2>
      <p style="color:#666">${message.replace(/[<>]/g, "")}</p>
      <p style="color:#999;font-size:12px">You can close this window.</p>
      <script>
        try { if (window.opener) window.opener.postMessage(${payload}, "*"); } catch (e) {}
        setTimeout(() => { try { window.close(); } catch(e) {} }, 1500);
      </script>
    </body></html>`,
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}
