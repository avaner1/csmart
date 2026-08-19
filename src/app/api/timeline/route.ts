import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";

export async function GET() {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

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
