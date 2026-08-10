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
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const note = await prisma.handoffNote.findUnique({ where: { id: params.id } });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (note.authorId !== user.id && !user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};
  if (body.content !== undefined) data.content = body.content;
  if (body.status !== undefined) data.status = body.status;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.tags !== undefined) data.tags = body.tags;
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  const updated = await prisma.handoffNote.update({
    where: { id: params.id },
    data,
    include: { author: { select: { name: true, image: true } }, roster: { select: { csmName: true, team: true } } },
  });

  return NextResponse.json({ note: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const note = await prisma.handoffNote.findUnique({ where: { id: params.id } });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (note.authorId !== user.id && !user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.handoffNote.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
