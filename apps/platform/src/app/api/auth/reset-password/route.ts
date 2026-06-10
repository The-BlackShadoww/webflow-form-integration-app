import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

const TTL_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ message: "Email required" }, { status: 400 });
  const user = await db.dashboardUser.findUnique({ where: { email } });
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await db.passwordResetToken.create({ data: { token, userId: user.id, expiresAt: new Date(Date.now() + TTL_MS) } });
    const link = `${env.DASHBOARD_URL}/reset-password?token=${token}`;
    console.info(`[auth] Password reset link for ${email}: ${link}`);
  }
  return NextResponse.json({ success: true });
}
