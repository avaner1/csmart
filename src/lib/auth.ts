import { headers } from "next/headers";
import { prisma } from "./prisma";
import { matchBookOfBusiness } from "./match-book";
import { ensureDbSetup } from "./db-setup";

export async function getVibeEmail(): Promise<string | null> {
  try {
    const headersList = headers();
    return headersList.get("x-vibe-user-email") ?? headersList.get("x-forwarded-user") ?? null;
  } catch {
    return null;
  }
}

export async function getDbUser() {
  try {
    await ensureDbSetup();
    const email = await getVibeEmail();
    if (!email) return null;
    return prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });
  } catch (e) {
    console.error("getDbUser error:", e);
    return null;
  }
}

function emailToName(email: string): string {
  return email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function syncVibeUser() {
  try {
    await ensureDbSetup();
  } catch (e) {
    console.error("ensureDbSetup error:", e);
  }

  const email = await getVibeEmail();
  if (!email) return null;

  try {
    let user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (user) {
      try {
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      } catch {}

      // Fix name if it looks like an email-derived guess
      try {
        const looksLikeEmailName = user.name === emailToName(email) || user.name.split(" ").length === 1;
        if (looksLikeEmailName) {
          const roster = await prisma.csmRoster.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
            select: { csmName: true },
          });
          if (roster?.csmName) {
            await prisma.user.update({ where: { id: user.id }, data: { name: roster.csmName } });
          }
        }
      } catch {}

      if (!user.autoMatchedBook) {
        await matchBookOfBusiness(user.id, user.name, email).catch(() => null);
      }

      return prisma.user.findUnique({ where: { id: user.id } }).catch(() => user);
    }

    // New user
    const name = emailToName(email);
    // Try to get real name from roster
    let rosterName: string | null = null;
    try {
      const roster = await prisma.csmRoster.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { csmName: true },
      });
      rosterName = roster?.csmName ?? null;
    } catch {}

    user = await prisma.user.create({
      data: {
        clerkId: email,
        name: rosterName ?? name,
        email,
      },
    });

    await matchBookOfBusiness(user.id, user.name, email).catch(() => null);
    return prisma.user.findUnique({ where: { id: user.id } }).catch(() => user);
  } catch (e) {
    console.error("syncVibeUser error:", e);
    return null;
  }
}
