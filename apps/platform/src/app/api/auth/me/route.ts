import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/jwt";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const user = await db.dashboardUser.findUnique({
    where: { id: auth.id },
    select: { id: true, email: true, name: true },
  });
  if (!user) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { name } = await req.json();
  if (typeof name !== "string" || !name.trim()) return NextResponse.json({ message: "Name required" }, { status: 400 });
  const user = await db.dashboardUser.update({
    where: { id: auth.id },
    data: { name: name.trim() },
    select: { id: true, email: true, name: true },
  });
  return NextResponse.json({ user });
}

export async function DELETE(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  await db.dashboardUser.delete({ where: { id: auth.id } });
  return NextResponse.json({ success: true });
}
