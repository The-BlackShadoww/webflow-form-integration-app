import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();
  if (!email || !password)
    return NextResponse.json(
      { message: "Email and password required" },
      { status: 400 },
    );
  const existing = await db.dashboardUser.findUnique({ where: { email } });
  if (existing)
    return NextResponse.json(
      { message: "Email already registered" },
      { status: 409 },
    );
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.dashboardUser.create({
    data: { email, passwordHash, name },
  });
  return NextResponse.json(
    {
      token: signToken(user.id, user.email),
      user: { id: user.id, email: user.email, name: user.name },
    },
    { status: 201 },
  );
}
