import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";

export async function GET() {
  const user = await getDbUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const trainings = await prisma.training.findMany({
    orderBy: { dueDate: "asc" },
    include: {
      completions: {
        select: { userId: true, status: true, user: { select: { name: true, email: true } } },
      },
    },
  });

  // Get all roster entries to determine who is assigned
  const allRoster = await prisma.csmRoster.findMany({
    where: { status: "Active" },
    select: { csmName: true, email: true, region: true, team: true },
  });

  const stats = trainings.map((t) => {
    // Determine who this training is assigned to
    let assignedUsers: { name: string; email: string; team: string }[];
    if (t.assignedTo === "all") {
      assignedUsers = allRoster.map((r) => ({ name: r.csmName, email: r.email, team: r.team }));
    } else {
      // Check if it matches a region, team, or individual email
      assignedUsers = allRoster
        .filter(
          (r) =>
            r.region.toLowerCase() === t.assignedTo.toLowerCase() ||
            r.team.toLowerCase() === t.assignedTo.toLowerCase() ||
            r.email.toLowerCase() === t.assignedTo.toLowerCase()
        )
        .map((r) => ({ name: r.csmName, email: r.email, team: r.team }));
    }

    const completedCount = t.completions.filter((c) => c.status === "completed").length;
    const inProgressCount = t.completions.filter((c) => c.status === "in-progress").length;
    const totalAssigned = assignedUsers.length;
    const notStartedCount = totalAssigned - completedCount - inProgressCount;

    // Users who haven't completed
    const completedEmails = new Set(
      t.completions
        .filter((c) => c.status === "completed")
        .map((c) => c.user.email.toLowerCase())
    );
    const incompleteUsers = assignedUsers.filter(
      (u) => !completedEmails.has(u.email.toLowerCase())
    );

    return {
      id: t.id,
      title: t.title,
      dueDate: t.dueDate.toISOString(),
      category: t.category,
      assignedTo: t.assignedTo,
      totalAssigned,
      completedCount,
      inProgressCount,
      notStartedCount: Math.max(0, notStartedCount),
      incompleteUsers,
    };
  });

  return NextResponse.json({ stats });
}
