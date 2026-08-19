import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUser, getVibeEmail } from "@/lib/auth";

export async function GET() {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const email = (await getVibeEmail()) ?? "";
  const fullName = user.name;

  // Find roster entry by email first, then name
  let rosterEntry = await prisma.csmRoster.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (!rosterEntry) {
    const allRoster = await prisma.csmRoster.findMany();
    const normalized = fullName.toLowerCase().replace(/[^a-z ]/g, "").trim();
    rosterEntry = allRoster.find((r) => {
      const rn = r.csmName.toLowerCase().replace(/[^a-z ]/g, "").trim();
      return rn === normalized;
    }) ?? null;
  }

  if (!rosterEntry) {
    return NextResponse.json({
      autoMatched: false,
      vertical: user.vertical,
      csManager: user.csManager,
      rhoCs: user.rhoCs,
      roster: null,
      accounts: [],
      totalAccounts: 0,
      keywords: [],
    });
  }

  // Get their accounts
  const accounts = await prisma.csmAccount.findMany({
    where: { csmName: rosterEntry.csmName },
    orderBy: { corporateBrand: "asc" },
  });

  // Build keywords from accounts and roster
  const cpNames = rosterEntry.cp ? rosterEntry.cp.split(",").map((s) => s.trim()) : [];
  const brandNames = accounts.map((a) => a.corporateBrand);
  const keywords = [
    ...cpNames,
    ...brandNames,
    rosterEntry.team,
    ...rosterEntry.team.split(/\s+/),
  ].filter(Boolean);

  return NextResponse.json({
    autoMatched: user.autoMatchedBook,
    vertical: user.vertical ?? rosterEntry.team,
    csManager: user.csManager ?? rosterEntry.manager,
    rhoCs: user.rhoCs ?? rosterEntry.rho,
    roster: {
      csmName: rosterEntry.csmName,
      email: rosterEntry.email,
      level: rosterEntry.level,
      status: rosterEntry.status,
      team: rosterEntry.team,
      region: rosterEntry.region,
      location: rosterEntry.location,
      cp: rosterEntry.cp,
      photoUrl: rosterEntry.photoUrl,
    },
    accounts: accounts.map((a) => ({
      corporateBrand: a.corporateBrand,
      cp: a.cp,
    })),
    totalAccounts: accounts.length,
    keywords,
  });
}
