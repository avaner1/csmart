import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
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

  const body = await request.json();
  const { sourceType, sourceId, title, content, sourceUrl, tags } = body;

  const existing = sourceId
    ? await prisma.savedItem.findFirst({
        where: { userId: user.id, sourceType, sourceId },
      })
    : null;

  if (existing) {
    return NextResponse.json({ saved: true, item: existing });
  }

  const item = await prisma.savedItem.create({
    data: {
      userId: user.id,
      sourceType,
      sourceId: sourceId ?? null,
      title,
      content,
      sourceUrl: sourceUrl ?? null,
      tags: tags ?? [],
    },
  });

  return NextResponse.json({ saved: true, item });
}

export async function DELETE(request: NextRequest) {
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

  const { sourceType, sourceId } = await request.json();

  if (sourceId) {
    await prisma.savedItem.deleteMany({
      where: { userId: user.id, sourceType, sourceId },
    });
  }

  return NextResponse.json({ saved: false });
}

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

  const savedIds = await prisma.savedItem.findMany({
    where: { userId: user.id, sourceType: "slack", isArchived: false },
    select: { sourceId: true },
  });

  return NextResponse.json({
    savedSourceIds: savedIds.map((s) => s.sourceId).filter(Boolean),
  });
}
