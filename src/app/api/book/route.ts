import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();
}

function namesMatch(clerkName: string, dbName: string): boolean {
  const a = normalize(clerkName);
  const b = normalize(dbName);
  if (a === b) return true;
  const aParts = a.split(" ");
  const bParts = b.split(" ");
  if (aParts.length >= 2 && bParts.length >= 2) {
    return aParts[0] === bParts[0] && aParts[aParts.length - 1] === bParts[bParts.length - 1];
  }
  return false;
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

  const fullName =
    `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim();

  const allRows = await prisma.salesAlignment.findMany();
  const matched = allRows.filter(
    (r) =>
      namesMatch(fullName, r.csmName) ||
      (r.secondCsm && namesMatch(fullName, r.secondCsm))
  );

  const grouped: Record<string, { sellerName: string; marketTeam: string }[]> = {};
  for (const row of matched) {
    if (!grouped[row.team]) grouped[row.team] = [];
    grouped[row.team].push({
      sellerName: row.sellerName,
      marketTeam: row.marketTeam,
    });
  }

  return NextResponse.json({
    autoMatched: user.autoMatchedBook,
    vertical: user.vertical,
    csManager: user.csManager,
    rhoCs: user.rhoCs,
    teams: grouped,
    totalAccounts: matched.length,
    keywords: matched.flatMap((r) => [
      r.sellerName,
      r.marketTeam,
      r.team,
    ]),
  });
}
