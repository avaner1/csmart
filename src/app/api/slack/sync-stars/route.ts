import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";
import { getSlackToken, slackApi, fetchUserProfile, makeDeepLink } from "@/lib/slack";

export async function POST() {
  const user = await getDbUser();
  if (!user) {
    console.log("[sync-stars] No user found");
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { token } = await getSlackToken();
  if (!token) {
    console.log("[sync-stars] No Slack token for user:", user.email);
    return NextResponse.json({ connected: false, imported: 0 });
  }

  console.log("[sync-stars] Starting sync for:", user.email, "token length:", token.length);

  try {
    // First, test if the token works at all
    let testResult;
    try {
      testResult = await slackApi<{ ok: boolean; user?: string }>(token, "auth.test", {});
      console.log("[sync-stars] auth.test ok:", testResult.ok, "user:", testResult.user);
    } catch (e) {
      console.error("[sync-stars] auth.test failed:", e);
      return NextResponse.json({ connected: false, imported: 0, error: "Token invalid" });
    }

    // Try stars.list
    let starsResponse;
    try {
      starsResponse = await slackApi<{
        items: {
          type: string;
          message?: { text: string; ts: string; user?: string };
          channel?: string;
        }[];
        paging?: { pages: number; page: number; total: number };
      }>(token, "stars.list", { limit: "100" });
      console.log("[sync-stars] stars.list returned:", starsResponse.items?.length ?? 0, "items, paging:", JSON.stringify(starsResponse.paging));
    } catch (e) {
      console.error("[sync-stars] stars.list failed:", e);
      return NextResponse.json({ connected: true, imported: 0, error: String(e) });
    }

    const allStars: {
      text: string;
      ts: string;
      userId?: string;
      channelId: string;
      channelName?: string;
    }[] = [];

    // Process first page
    for (const item of starsResponse.items ?? []) {
      if (item.type === "message" && item.message && item.channel) {
        allStars.push({
          text: item.message.text,
          ts: item.message.ts,
          userId: item.message.user,
          channelId: item.channel,
        });
      }
    }

    // Paginate remaining pages using page numbers (stars.list uses page-based pagination)
    const totalPages = starsResponse.paging?.pages ?? 1;
    for (let page = 2; page <= totalPages && page <= 10; page++) {
      try {
        const pageData = await slackApi<{
          items: {
            type: string;
            message?: { text: string; ts: string; user?: string };
            channel?: string;
          }[];
        }>(token, "stars.list", { limit: "100", page: String(page) });

        for (const item of pageData.items ?? []) {
          if (item.type === "message" && item.message && item.channel) {
            allStars.push({
              text: item.message.text,
              ts: item.message.ts,
              userId: item.message.user,
              channelId: item.channel,
            });
          }
        }
      } catch {
        break;
      }
    }

    console.log("[sync-stars] Total starred messages found:", allStars.length);

    if (allStars.length === 0) {
      return NextResponse.json({ connected: true, imported: 0, total: 0 });
    }

    // Get existing saved sourceIds to avoid duplicates
    const existing = await prisma.savedItem.findMany({
      where: { userId: user.id, sourceType: "slack" },
      select: { sourceId: true },
    });
    const existingIds = new Set(existing.map((e) => e.sourceId).filter(Boolean));
    console.log("[sync-stars] Existing saved items:", existingIds.size);

    const newStars = allStars.filter((s) => !existingIds.has(s.ts));
    console.log("[sync-stars] New items to import:", newStars.length);

    if (newStars.length === 0) {
      return NextResponse.json({ connected: true, imported: 0, total: allStars.length });
    }

    // Resolve channel names and author profiles (batch, with caching)
    const channelNameCache = new Map<string, string>();
    const authorCache = new Map<string, { name: string; avatar: string }>();

    let imported = 0;
    for (const star of newStars) {
      try {
        // Get channel name
        if (!channelNameCache.has(star.channelId)) {
          try {
            const chData = await slackApi<{ channel: { name: string } }>(
              token, "conversations.info", { channel: star.channelId }
            );
            channelNameCache.set(star.channelId, chData.channel.name);
          } catch {
            channelNameCache.set(star.channelId, star.channelId);
          }
        }
        const channelName = channelNameCache.get(star.channelId) ?? star.channelId;

        // Get author name
        let authorName = "Unknown";
        if (star.userId) {
          if (!authorCache.has(star.userId)) {
            try {
              const profile = await fetchUserProfile(token, star.userId);
              authorCache.set(star.userId, { name: profile.realName, avatar: profile.avatar });
            } catch {
              authorCache.set(star.userId, { name: "Unknown", avatar: "" });
            }
          }
          authorName = authorCache.get(star.userId)?.name ?? "Unknown";
        }

        const title = `${authorName} in #${channelName}`;

        await prisma.savedItem.create({
          data: {
            userId: user.id,
            sourceType: "slack",
            sourceId: star.ts,
            title: title.slice(0, 200),
            content: star.text,
            sourceUrl: makeDeepLink(star.channelId, star.ts),
            tags: ["slack-star"],
          },
        });
        imported++;
      } catch (e) {
        console.error("[sync-stars] Error importing star:", e);
      }
    }

    console.log("[sync-stars] Import complete:", imported, "new items");
    return NextResponse.json({ connected: true, imported, total: allStars.length });
  } catch (error) {
    console.error("[sync-stars] Unexpected error:", error);
    return NextResponse.json({ error: "Failed to sync stars", details: String(error) }, { status: 500 });
  }
}
