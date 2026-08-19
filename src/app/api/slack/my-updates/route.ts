import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUser, getVibeEmail } from "@/lib/auth";
import {
  getSlackToken,
  fetchChannels,
  fetchMessages,
  enrichMessages,
} from "@/lib/slack";

export async function GET() {
  const user = await getDbUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { token, hiddenChannels } = await getSlackToken();
  if (!token) {
    return NextResponse.json({ connected: false });
  }

  const email = (await getVibeEmail()) ?? "";
  const fullName = user.name;

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
    console.warn(`[my-updates] No roster match for user: ${user?.name} (${email}). autoMatchedBook=${user?.autoMatchedBook}`);
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
    const allChannels = await fetchChannels(token);
    const channels = allChannels.filter((c) => !hiddenChannels.includes(c.id));
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

        const urgentWords = ["urgent", "asap", "immediately", "blocker", "blocked", "critical", "emergency", "p0", "sev0", "sev1", "reminder", "complete", "survey"];
        const highWords = ["deadline", "eod", "end of day", "eow", "end of week", "time-sensitive", "time sensitive", "action required", "action needed", "please respond", "need response", "follow up needed", "escalat"];
        const normalWords = ["fyi", "heads up", "heads-up", "update", "follow up", "checking in", "circling back"];

        let urgency: string;
        if (urgentWords.some((w) => text.includes(w))) urgency = "urgent";
        else if (highWords.some((w) => text.includes(w))) urgency = "high";
        else if (normalWords.some((w) => text.includes(w))) urgency = "normal";
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
