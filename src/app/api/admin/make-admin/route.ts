import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const caller = await getDbUser();
  if (!caller) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (!caller.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const target = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (!target) {
    return NextResponse.json(
      { error: "User not found. They must sign in first." },
      { status: 404 }
    );
  }

  await prisma.user.update({
    where: { id: target.id },
    data: { isAdmin: true },
  });

  return NextResponse.json({ success: true, name: target.name });
}
