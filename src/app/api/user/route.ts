import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
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
