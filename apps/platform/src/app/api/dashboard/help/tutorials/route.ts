import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/jwt";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const res = await fetch(`${env.FEEDBACK_API_URL.replace(/\/$/, "")}/project-meta`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ app_name: env.APP_NAME, key: "tutorials" }),
      next: { revalidate: 3600 },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ tutorials: Array.isArray(data?.meta_value) ? data.meta_value : [] });
  } catch (err: any) {
    return NextResponse.json({ tutorials: [], error: String(err?.message ?? err) }, { status: 200 });
  }
}
