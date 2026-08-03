import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;
  return prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const item = await prisma.savedItem.findUnique({
    where: { id: params.id },
  });

  if (!item || item.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.tags !== undefined) data.tags = body.tags;
  if (body.notes !== undefined) data.notes = body.notes;
  if (body.isArchived !== undefined) data.isArchived = body.isArchived;

  const updated = await prisma.savedItem.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const item = await prisma.savedItem.findUnique({
    where: { id: params.id },
  });

  if (!item || item.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.savedItem.delete({ where: { id: params.id } });

  return NextResponse.json({ deleted: true });
}
