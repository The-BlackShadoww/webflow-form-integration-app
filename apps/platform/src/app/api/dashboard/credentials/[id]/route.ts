import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/jwt";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const id = Number((await ctx.params).id);
  const owned = await db.integrationCredential.findFirst({ where: { id, dashboardUserId: auth.id } });
  if (!owned) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const { connectionName } = await req.json();
  if (typeof connectionName !== "string" || !connectionName.trim()) {
    return NextResponse.json({ message: "connectionName required" }, { status: 400 });
  }
  const credential = await db.integrationCredential.update({ where: { id }, data: { connectionName } });
  return NextResponse.json({ credential });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const id = Number((await ctx.params).id);
  const owned = await db.integrationCredential.findFirst({ where: { id, dashboardUserId: auth.id } });
  if (!owned) return NextResponse.json({ message: "Not found" }, { status: 404 });
  await db.integrationCredential.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
