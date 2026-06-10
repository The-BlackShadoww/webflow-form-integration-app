import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/jwt";
import { userOwnsMapping } from "@/lib/mapping-ownership";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const id = Number((await ctx.params).id);
  const mapping = await userOwnsMapping(id, auth.id);
  if (!mapping) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const { config, integrationName } = await req.json();
  const updated = await db.globalIntegration.update({
    where: { id },
    data: {
      ...(config !== undefined ? { config } : {}),
      ...(integrationName !== undefined ? { integrationName } : {}),
    },
    include: { credential: true },
  });
  return NextResponse.json({ mapping: updated });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const id = Number((await ctx.params).id);
  const mapping = await userOwnsMapping(id, auth.id);
  if (!mapping) return NextResponse.json({ message: "Not found" }, { status: 404 });
  await db.globalIntegration.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
