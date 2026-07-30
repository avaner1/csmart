import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await prisma.user.update({
    where: { clerkId: clerkUser.id },
    data: {
      slackAccessToken: null,
      slackTeamName: null,
      slackConnected: false,
    },
  });

  return NextResponse.json({ success: true });
}
