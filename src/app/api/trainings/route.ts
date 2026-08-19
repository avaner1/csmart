import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";

export async function GET() {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Look up the user's roster entry for region/team matching
  const roster = await prisma.csmRoster.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
  });

  // Get all trainings with completion data
  const trainings = await prisma.training.findMany({
    orderBy: { dueDate: "asc" },
    include: {
      completions: {
        select: { userId: true, status: true },
      },
    },
  });

  // Filter to trainings assigned to this user
  const myTrainings = trainings.filter((t) => {
    if (t.assignedTo === "all") return true;
    if (roster) {
      if (t.assignedTo.toLowerCase() === roster.region.toLowerCase()) return true;
      if (t.assignedTo.toLowerCase() === roster.team.toLowerCase()) return true;
    }
    if (t.assignedTo.toLowerCase() === user.email.toLowerCase()) return true;
    return false;
  });

  // Build response with user's completion status and stats
  const result = myTrainings.map((t) => {
    const myCompletion = t.completions.find((c) => c.userId === user.id);
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      sourceUrl: t.sourceUrl,
      dueDate: t.dueDate.toISOString(),
      assignedTo: t.assignedTo,
      category: t.category,
      isRequired: t.isRequired,
      createdAt: t.createdAt.toISOString(),
      myStatus: myCompletion?.status ?? "not-started",
      completionStats: {
        total: t.completions.length,
        completed: t.completions.filter((c) => c.status === "completed").length,
      },
    };
  });

  return NextResponse.json({ trainings: result });
}

export async function POST(request: NextRequest) {
  const user = await getDbUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  if (!body.title || !body.sourceUrl || !body.dueDate) {
    return NextResponse.json(
      { error: "title, sourceUrl, and dueDate are required" },
      { status: 400 }
    );
  }

  const training = await prisma.training.create({
    data: {
      title: body.title,
      description: body.description ?? "",
      sourceUrl: body.sourceUrl,
      dueDate: new Date(body.dueDate),
      assignedTo: body.assignedTo ?? "all",
      category: body.category ?? "product-training",
      isRequired: body.isRequired ?? true,
      createdById: user.id,
    },
  });

  return NextResponse.json({ training });
}
