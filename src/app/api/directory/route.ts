import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  const all = request.nextUrl.searchParams.get("all");
  const regionFilter = request.nextUrl.searchParams.get("region");
  const levelFilter = request.nextUrl.searchParams.get("level");
  const statusFilter = request.nextUrl.searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (regionFilter && regionFilter !== "all") where.region = regionFilter;
  if (levelFilter && levelFilter !== "all") where.level = levelFilter;
  if (statusFilter && statusFilter !== "all") where.status = statusFilter;

  if (all === "true") {
    const rows = await prisma.csmRoster.findMany({
      where,
      orderBy: [{ region: "asc" }, { team: "asc" }, { level: "asc" }, { csmName: "asc" }],
    });
    return NextResponse.json({ results: rows });
  }

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const rows = await prisma.csmRoster.findMany({
    where: {
      ...where,
      OR: [
        { csmName: { contains: query, mode: "insensitive" } },
        { cp: { contains: query, mode: "insensitive" } },
        { team: { contains: query, mode: "insensitive" } },
        { manager: { contains: query, mode: "insensitive" } },
        { rho: { contains: query, mode: "insensitive" } },
        { location: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { csmName: "asc" },
    take: 20,
  });

  const lower = query.toLowerCase();
  const scored = rows.map((r) => {
    const exact = r.csmName.toLowerCase() === lower || r.cp.toLowerCase() === lower;
    const starts = r.csmName.toLowerCase().startsWith(lower) || r.cp.toLowerCase().startsWith(lower);
    return { ...r, _score: exact ? 0 : starts ? 1 : 2 };
  });
  scored.sort((a, b) => a._score - b._score);

  return NextResponse.json({ results: scored });
}
