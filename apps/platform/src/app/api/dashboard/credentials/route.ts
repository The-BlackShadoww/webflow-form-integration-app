import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const credentials = await db.integrationCredential.findMany({
    where: { dashboardUserId: auth.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ credentials });
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { type, connectionName, apiKey, url, accessToken, refreshToken, expiresAt, destinationId, destinationLabel } = await req.json();
  if (!type || !connectionName) return NextResponse.json({ message: "type and connectionName required" }, { status: 400 });
  const credential = await db.integrationCredential.create({
    data: {
      type,
      connectionName,
      siteId: "",
      dashboardUserId: auth.id,
      apiKey: apiKey ?? null,
      url: url ?? null,
      accessToken: accessToken ?? null,
      refreshToken: refreshToken ?? null,
      expiresAt: expiresAt ?? null,
      extraData: { destinationId: destinationId ?? null, destinationLabel: destinationLabel ?? null },
    },
  });
  return NextResponse.json({ credential }, { status: 201 });
}
