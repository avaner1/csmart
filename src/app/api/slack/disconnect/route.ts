import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      slackAccessToken: null,
      slackTeamName: null,
      slackConnected: false,
    },
  });

  return NextResponse.json({ success: true });
}
