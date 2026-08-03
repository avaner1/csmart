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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.date !== undefined) data.date = new Date(body.date);
  if (body.endDate !== undefined)
    data.endDate = body.endDate ? new Date(body.endDate) : null;
  if (body.itemType !== undefined) data.itemType = body.itemType;
  if (body.category !== undefined) data.category = body.category;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.link !== undefined) data.link = body.link || null;
  if (body.isRecurring !== undefined) data.isRecurring = body.isRecurring;
  if (body.recurrencePattern !== undefined)
    data.recurrencePattern = body.recurrencePattern || null;

  const item = await prisma.adminItem.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json({ item });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.adminItem.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
