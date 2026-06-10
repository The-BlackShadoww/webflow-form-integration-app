import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { token, newPassword } = await req.json();
  if (!token || !newPassword) return NextResponse.json({ message: "token and newPassword required" }, { status: 400 });
  if (newPassword.length < 8) return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
  const row = await db.passwordResetToken.findUnique({ where: { token } });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return NextResponse.json({ message: "Invalid or expired token" }, { status: 400 });
  }
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.$transaction([
    db.dashboardUser.update({ where: { id: row.userId }, data: { passwordHash } }),
    db.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
  ]);
  return NextResponse.json({ success: true });
}
