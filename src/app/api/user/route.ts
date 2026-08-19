import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUser, syncVibeUser } from "@/lib/auth";

export async function GET() {
  let user = await getDbUser();

  if (!user) {
    user = await syncVibeUser();
  }

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      slackConnected: user.slackConnected,
      slackTeamName: user.slackTeamName,
      googleConnected: user.googleConnected,
      isAdmin: user.isAdmin,
      vertical: user.vertical,
      csManager: user.csManager,
      rhoCs: user.rhoCs,
      autoMatchedBook: user.autoMatchedBook,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { name } = await request.json();

  if (name?.trim()) {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: name.trim() },
    });
  }

  return NextResponse.json({ success: true });
}
