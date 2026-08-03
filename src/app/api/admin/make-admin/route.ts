import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const caller = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });
  if (!caller?.isAdmin) {
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
