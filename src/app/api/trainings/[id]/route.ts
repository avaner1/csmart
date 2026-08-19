import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getDbUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.title !== undefined) data.title = body.title;
  if (body.description !== undefined) data.description = body.description;
  if (body.sourceUrl !== undefined) data.sourceUrl = body.sourceUrl;
  if (body.dueDate !== undefined) data.dueDate = new Date(body.dueDate);
  if (body.assignedTo !== undefined) data.assignedTo = body.assignedTo;
  if (body.category !== undefined) data.category = body.category;
  if (body.isRequired !== undefined) data.isRequired = body.isRequired;

  const training = await prisma.training.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json({ training });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getDbUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.training.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
