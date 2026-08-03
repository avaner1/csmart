import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });
  if (!user?.isAdmin) return null;
  return user;
}

export async function GET(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const filter = request.nextUrl.searchParams.get("filter");
  const where: Record<string, unknown> = {};
  if (filter === "recurring") where.isRecurring = true;

  const items = await prisma.adminItem.findMany({
    where,
    orderBy: { date: "asc" },
    include: { createdBy: { select: { name: true } } },
  });

  return NextResponse.json({ items });
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const item = await prisma.adminItem.create({
    data: {
      createdById: user.id,
      title: body.title,
      description: body.description ?? "",
      date: new Date(body.date),
      endDate: body.endDate ? new Date(body.endDate) : null,
      itemType: body.itemType,
      category: body.category,
      priority: body.priority ?? "normal",
      link: body.link || null,
      isRecurring: body.isRecurring ?? false,
      recurrencePattern: body.recurrencePattern || null,
    },
  });

  return NextResponse.json({ item });
}
