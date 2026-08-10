import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  getSlackToken,
  fetchChannels,
  fetchMessages,
  enrichMessages,
} from "@/lib/slack";

// Removed — using email-based matching now
/*function namesMatch(a: string, b: string): boolean {
  const na = a.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  const nb = b.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  if (na === nb) return true;
  const ap = na.split(" ");
  const bp = nb.split(" ");
  if (ap.length >= 2 && bp.length >= 2) {
    return ap[0] === bp[0] && ap[ap.length - 1] === bp[bp.length - 1];
  }
  return false;
}*/

export async function GET() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { token, dbUserId } = await getSlackToken();
  if (!token || !dbUserId) {
    return NextResponse.json({ connected: false });
  }

  const user = await prisma.user.findUnique({ where: { id: dbUserId } });
  if (!user) {
    return NextResponse.json({ connected: false });
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const fullName =
    `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim();

  // Find roster entry by email, then name
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
    return NextResponse.json({ connected: true, hasBook: false, updates: [] });
  }

  // Get accounts for keyword matching
  const accounts = await prisma.csmAccount.findMany({
    where: { csmName: rosterEntry.csmName },
  });

  const cpNames = rosterEntry.cp ? rosterEntry.cp.split(",").map((s) => s.trim().toLowerCase()) : [];
  const brandNames = accounts.map((a) => a.corporateBrand.toLowerCase());

  // Add coverage keywords
  const coveringFor = user?.coveringFor ?? [];
  let coverageKeywords: string[] = [];
  if (coveringFor.length > 0) {
    const coveredRosters = await prisma.csmRoster.findMany({
      where: { csmName: { in: coveringFor } },
    });
    coverageKeywords = coveredRosters.flatMap((r) =>
      r.cp ? r.cp.split(",").map((s) => s.trim().toLowerCase()) : []
    );
  }

  const keywords = [
    ...cpNames,
    ...brandNames,
    rosterEntry.team.toLowerCase(),
    ...coverageKeywords,
  ].filter(Boolean);

  try {
    const channels = await fetchChannels(token);
    const americas = channels.find((c) => c.isAmericasCs);

    const targetChannels = americas
      ? [americas, ...channels.filter((c) => !c.isAmericasCs).slice(0, 4)]
      : channels.slice(0, 5);

    const twentyFourHoursAgo = String(Math.floor(Date.now() / 1000) - 24 * 60 * 60);

    const allMessages = await Promise.all(
      targetChannels.map(async (ch) => {
        const msgs = await fetchMessages(token, ch.id, 50, twentyFourHoursAgo);
        return enrichMessages(token, msgs, ch.id, ch.name);
      })
    );

    const flat = allMessages.flat();

    const updates = flat
      .filter((msg) => {
        const text = msg.text.toLowerCase();
        return keywords.some((kw) => text.includes(kw));
      })
      .map((msg) => {
        const text = msg.text.toLowerCase();
        const matchedKeyword = keywords.find((kw) => text.includes(kw)) ?? null;

        const totalReactions = msg.reactions.reduce((s, r) => s + r.count, 0);
        let urgency: string;
        if (msg.replyCount >= 10 || totalReactions >= 5) urgency = "urgent";
        else if (msg.replyCount >= 5 || totalReactions >= 3) urgency = "high";
        else if (msg.replyCount >= 2 || totalReactions >= 1) urgency = "normal";
        else urgency = "low";

        return { ...msg, matchedKeyword, urgency };
      })
      .sort((a, b) => {
        const order = { urgent: 0, high: 1, normal: 2, low: 3 };
        const ao = order[a.urgency as keyof typeof order] ?? 3;
        const bo = order[b.urgency as keyof typeof order] ?? 3;
        return ao - bo || parseFloat(b.ts) - parseFloat(a.ts);
      })
      .slice(0, 15);

    return NextResponse.json({ connected: true, hasBook: true, updates });
  } catch (error) {
    console.error("Failed to fetch my-updates:", error);
    return NextResponse.json(
      { error: "Failed to fetch updates" },
      { status: 500 }
    );
  }
}
