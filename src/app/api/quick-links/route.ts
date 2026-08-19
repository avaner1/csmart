import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";

export async function GET() {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const links = await prisma.quickLink.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ links });
}

export async function POST(request: NextRequest) {
  const user = await getDbUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  if (!body.title || !body.url) {
    return NextResponse.json(
      { error: "title and url are required" },
      { status: 400 }
    );
  }

  const link = await prisma.quickLink.create({
    data: {
      title: body.title,
      url: body.url,
      description: body.description ?? "",
    },
  });

  return NextResponse.json({ link });
}

export async function DELETE(request: NextRequest) {
  const user = await getDbUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.quickLink.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
