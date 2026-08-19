import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { sourceType, sourceId, title, content, sourceUrl, tags } =
      await request.json();

    if (sourceId) {
      const existing = await prisma.savedItem.findFirst({
        where: { userId: user.id, sourceType, sourceId },
      });
      if (existing) {
        return NextResponse.json({ item: existing });
      }
    }

    const item = await prisma.savedItem.create({
      data: {
        userId: user.id,
        sourceType,
        sourceId: sourceId ?? null,
        title: title || content?.slice(0, 100) || "Untitled",
        content,
        sourceUrl: sourceUrl ?? null,
        tags: tags ?? [],
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Save item error:", error);
    return NextResponse.json({ error: "Failed to save item" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const sourceType = params.get("sourceType");
  const isArchived = params.get("isArchived");
  const search = params.get("search");
  const tag = params.get("tag");
  const idsOnly = params.get("idsOnly");

  if (idsOnly === "true") {
    const items = await prisma.savedItem.findMany({
      where: { userId: user.id, isArchived: false },
      select: { sourceId: true, sourceType: true },
    });
    return NextResponse.json({
      savedSourceIds: items
        .filter((i) => i.sourceId)
        .map((i) => `${i.sourceType}:${i.sourceId}`),
    });
  }

  const where: Record<string, unknown> = { userId: user.id };

  if (sourceType) {
    where.sourceType = sourceType;
  }

  if (isArchived === "true") {
    where.isArchived = true;
  } else if (isArchived !== "all") {
    where.isArchived = false;
  }

  if (tag) {
    where.tags = { has: tag };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
    ];
  }

  const items = await prisma.savedItem.findMany({
    where,
    orderBy: { savedAt: "desc" },
  });

  const allTags = await prisma.savedItem.findMany({
    where: { userId: user.id, isArchived: false },
    select: { tags: true },
  });
  const tagSet = new Set<string>();
  allTags.forEach((item) => item.tags.forEach((t) => tagSet.add(t)));

  return NextResponse.json({
    items,
    allTags: Array.from(tagSet).sort(),
    total: items.length,
  });
}

export async function DELETE(request: NextRequest) {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { sourceType, sourceId } = await request.json();

  if (sourceId) {
    await prisma.savedItem.deleteMany({
      where: { userId: user.id, sourceType, sourceId },
    });
  }

  return NextResponse.json({ deleted: true });
}
