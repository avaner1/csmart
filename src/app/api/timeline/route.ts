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
    select: { isAdmin: true },
  });

  const now = new Date();
  const ninetyDaysOut = new Date(now);
  ninetyDaysOut.setDate(ninetyDaysOut.getDate() + 90);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const items = await prisma.adminItem.findMany({
    where: {
      date: { gte: thirtyDaysAgo, lte: ninetyDaysOut },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({
    items,
    isAdmin: user?.isAdmin ?? false,
  });
}
