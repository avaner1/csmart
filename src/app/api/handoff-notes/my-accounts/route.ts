import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const clerkUser = await currentUser();
  if (!clerkUser) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: clerkUser.id } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const fullName = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim();

  // Find the user's roster entry
  let rosterEntry = await prisma.csmRoster.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (!rosterEntry) {
    const all = await prisma.csmRoster.findMany();
    const norm = fullName.toLowerCase().replace(/[^a-z ]/g, "").trim();
    rosterEntry = all.find((r) => r.csmName.toLowerCase().replace(/[^a-z ]/g, "").trim() === norm) ?? null;
  }

  // Notes on my accounts
  let onMyAccounts: unknown[] = [];
  if (rosterEntry) {
    onMyAccounts = await prisma.handoffNote.findMany({
      where: { rosterId: rosterEntry.id, status: { not: "archived" } },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true, image: true } },
        roster: { select: { csmName: true, team: true, cp: true } },
      },
    });
  }

  // Also check covering
  const coveringIds = user.coveringFor ?? [];
  let coveringNotes: unknown[] = [];
  if (coveringIds.length > 0) {
    const coveredRosters = await prisma.csmRoster.findMany({
      where: { csmName: { in: coveringIds } },
      select: { id: true, csmName: true },
    });
    if (coveredRosters.length > 0) {
      coveringNotes = await prisma.handoffNote.findMany({
        where: {
          rosterId: { in: coveredRosters.map((r) => r.id) },
          status: { not: "archived" },
        },
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { name: true, image: true } },
          roster: { select: { csmName: true, team: true, cp: true } },
        },
      });
    }
  }

  // Notes I authored on others' accounts
  const myAuthoredNotes = await prisma.handoffNote.findMany({
    where: {
      authorId: user.id,
      status: { not: "archived" },
      ...(rosterEntry ? { rosterId: { not: rosterEntry.id } } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true, image: true } },
      roster: { select: { csmName: true, team: true, cp: true } },
    },
  });

  // New notes since last login
  const newSinceLogin = rosterEntry && user.lastLoginAt
    ? await prisma.handoffNote.count({
        where: {
          rosterId: rosterEntry.id,
          status: "active",
          createdAt: { gt: user.lastLoginAt },
        },
      })
    : 0;

  return NextResponse.json({
    onMyAccounts,
    coveringNotes,
    myAuthoredNotes,
    newSinceLogin,
    rosterEntry: rosterEntry ? { id: rosterEntry.id, csmName: rosterEntry.csmName, cp: rosterEntry.cp, team: rosterEntry.team } : null,
  });
}
