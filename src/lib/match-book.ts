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

export async function matchBookOfBusiness(userId: string, clerkName: string) {
  const allRows = await prisma.salesAlignment.findMany();

  const matched = allRows.filter(
    (r) =>
      namesMatch(clerkName, r.csmName) ||
      (r.secondCsm && namesMatch(clerkName, r.secondCsm))
  );

  if (matched.length === 0) return null;

  const teams = Array.from(new Set(matched.map((r) => r.team)));
  const vertical = teams.join(", ");
  const csManager = matched[0].csManager;
  const rhoCs = matched[0].rhoCs;

  await prisma.user.update({
    where: { id: userId },
    data: {
      vertical,
      csManager,
      rhoCs,
      autoMatchedBook: true,
    },
  });

  return { matched, vertical, csManager, rhoCs };
}
