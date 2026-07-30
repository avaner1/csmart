import { NextResponse } from "next/server";
import {
  getSlackToken,
  slackApi,
  fetchUserProfile,
  makeDeepLink,
} from "@/lib/slack";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { token, dbUserId } = await getSlackToken();
  if (!token) {
    return NextResponse.json({ connected: false });
  }

  try {
    // Fetch Slack starred items
    const starsData = await slackApi<{
      items: {
        type: string;
        message?: {
          text: string;
          ts: string;
          user?: string;
        };
        channel?: string;
      }[];
    }>(token, "stars.list", { limit: "50" });

    const starredMessages = await Promise.all(
      starsData.items
        .filter((item) => item.type === "message" && item.message && item.channel)
        .map(async (item) => {
          const msg = item.message!;
          const channelId = item.channel!;

          const profile = msg.user
            ? await fetchUserProfile(token, msg.user).catch(() => null)
            : null;

          // Get channel name
          let channelName = channelId;
          try {
            const chData = await slackApi<{
              channel: { name: string };
            }>(token, "conversations.info", { channel: channelId });
            channelName = chData.channel.name;
          } catch {
            // Fall back to channel ID
          }

          return {
            text: msg.text,
            ts: msg.ts,
            authorName: profile?.realName ?? "Unknown",
            authorAvatar: profile?.avatar ?? "",
            channelId,
            channelName,
            deepLink: makeDeepLink(channelId, msg.ts),
            source: "slack-stars" as const,
          };
        })
    );

    // Fetch our database saved items (extended retention)
    let dbSavedItems: {
      id: string;
      title: string;
      content: string;
      sourceId: string | null;
      sourceUrl: string | null;
      tags: string[];
      notes: string | null;
      savedAt: Date;
    }[] = [];

    if (dbUserId) {
      dbSavedItems = await prisma.savedItem.findMany({
        where: { userId: dbUserId, sourceType: "slack", isArchived: false },
        orderBy: { savedAt: "desc" },
      });
    }

    return NextResponse.json({
      connected: true,
      starred: starredMessages,
      saved: dbSavedItems.map((item) => ({
        id: item.id,
        title: item.title,
        text: item.content,
        sourceId: item.sourceId,
        deepLink: item.sourceUrl,
        tags: item.tags,
        notes: item.notes,
        savedAt: item.savedAt.toISOString(),
        source: "database" as const,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch saved items:", error);
    return NextResponse.json(
      { error: "Failed to fetch saved items" },
      { status: 500 }
    );
  }
}
