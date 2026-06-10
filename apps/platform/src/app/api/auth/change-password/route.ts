import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) return NextResponse.json({ message: "currentPassword and newPassword required" }, { status: 400 });
  if (newPassword.length < 8) return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
  const user = await db.dashboardUser.findUnique({ where: { id: auth.id } });
  if (!user) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return NextResponse.json({ message: "Current password is incorrect" }, { status: 401 });
  await db.dashboardUser.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(newPassword, 10) } });
  return NextResponse.json({ success: true });
}
