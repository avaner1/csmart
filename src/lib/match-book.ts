import { prisma } from "./prisma";

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

export async function matchBookOfBusiness(userId: string, clerkName: string, clerkEmail?: string) {
  // Try exact email match first (most reliable)
  let matched = clerkEmail
    ? await prisma.csmRoster.findMany({
        where: { email: { equals: clerkEmail, mode: "insensitive" } },
      })
    : [];

  // Fall back to fuzzy name match
  if (matched.length === 0) {
    const allRows = await prisma.csmRoster.findMany();
    matched = allRows.filter((r) => namesMatch(clerkName, r.csmName));
  }

  if (matched.length === 0) return null;

  const entry = matched[0];
  const vertical = entry.team;
  const csManager = entry.manager;
  const rhoCs = entry.rho;

  await prisma.user.update({
    where: { id: userId },
    data: {
      vertical,
      csManager,
      rhoCs,
      autoMatchedBook: true,
      image: entry.photoUrl || undefined,
    },
  });

  return { matched, vertical, csManager, rhoCs };
}
