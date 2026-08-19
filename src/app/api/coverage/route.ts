import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";

export async function GET() {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const coveringFor = user.coveringFor ?? [];
  const coveredPeople = coveringFor.length > 0
    ? await prisma.csmRoster.findMany({
        where: { csmName: { in: coveringFor } },
        select: { csmName: true, team: true, cp: true, photoUrl: true, status: true, region: true },
      })
    : [];

  return NextResponse.json({ coveringFor: coveredPeople });
}

export async function POST(request: NextRequest) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { csmName, action } = await request.json();

  if (action === "add") {
    const current = user.coveringFor ?? [];
    if (!current.includes(csmName)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { coveringFor: [...current, csmName] },
      });
    }
  } else if (action === "remove") {
    const current = user.coveringFor ?? [];
    await prisma.user.update({
      where: { id: user.id },
      data: { coveringFor: current.filter((n) => n !== csmName) },
    });
  }

  return NextResponse.json({ success: true });
}
