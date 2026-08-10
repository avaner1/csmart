import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;
  return prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
}

export async function POST(request: NextRequest) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { rosterId, cpName, content, status, priority, tags, dueDate } = await request.json();

  if (!rosterId || !cpName || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const note = await prisma.handoffNote.create({
    data: {
      rosterId,
      cpName,
      authorId: user.id,
      content,
      status: status ?? "active",
      priority: priority ?? "normal",
      tags: tags ?? [],
      dueDate: dueDate ? new Date(dueDate) : null,
    },
    include: { author: { select: { name: true, image: true } }, roster: { select: { csmName: true, team: true } } },
  });

  return NextResponse.json({ note });
}

export async function GET(request: NextRequest) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const params = request.nextUrl.searchParams;
  const where: Record<string, unknown> = {};

  if (params.get("rosterId")) where.rosterId = params.get("rosterId");
  if (params.get("cpName")) where.cpName = { contains: params.get("cpName"), mode: "insensitive" };
  if (params.get("status")) where.status = params.get("status");
  if (params.get("priority")) where.priority = params.get("priority");

  const csmName = params.get("csmName");
  if (csmName) {
    const rosterIds = await prisma.csmRoster.findMany({
      where: { csmName: { equals: csmName, mode: "insensitive" } },
      select: { id: true },
    });
    where.rosterId = { in: rosterIds.map((r) => r.id) };
  }

  const team = params.get("team");
  if (team) {
    const rosterIds = await prisma.csmRoster.findMany({
      where: { team: { contains: team, mode: "insensitive" } },
      select: { id: true },
    });
    where.rosterId = { in: rosterIds.map((r) => r.id) };
  }

  const notes = await prisma.handoffNote.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true, image: true } },
      roster: { select: { csmName: true, team: true, cp: true, region: true } },
    },
  });

  return NextResponse.json({ notes });
}
