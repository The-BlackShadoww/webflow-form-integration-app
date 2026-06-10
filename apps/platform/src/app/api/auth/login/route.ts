import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password)
    return NextResponse.json(
      { message: "Email and password required" },
      { status: 400 },
    );
  const user = await db.dashboardUser.findUnique({ where: { email } });
  if (!user)
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 },
    );
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok)
    return NextResponse.json(
      { message: "Invalid credentials" },
      { status: 401 },
    );
  return NextResponse.json({
    token: signToken(user.id, user.email),
    user: { id: user.id, email: user.email, name: user.name },
  });
}
