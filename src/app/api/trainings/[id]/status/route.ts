import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const status = body.status;

  if (!["not-started", "in-progress", "completed"].includes(status)) {
    return NextResponse.json(
      { error: "status must be not-started, in-progress, or completed" },
      { status: 400 }
    );
  }

  const completion = await prisma.trainingCompletion.upsert({
    where: {
      trainingId_userId: {
        trainingId: params.id,
        userId: user.id,
      },
    },
    update: {
      status,
      completedAt: status === "completed" ? new Date() : null,
    },
    create: {
      trainingId: params.id,
      userId: user.id,
      status,
      completedAt: status === "completed" ? new Date() : null,
    },
  });

  return NextResponse.json({ completion });
}
