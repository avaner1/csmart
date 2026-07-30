import { NextResponse } from "next/server";
import {
  getSlackToken,
  fetchChannels,
  fetchMessages,
  fetchThreadReplies,
  fetchUserProfile,
  makeDeepLink,
} from "@/lib/slack";

export async function GET() {
  const { token } = await getSlackToken();
  if (!token) {
    return NextResponse.json({ connected: false });
  }

  try {
    const channels = await fetchChannels(token);
    const americas = channels.find((c) => c.isAmericasCs);

    if (!americas) {
      return NextResponse.json({ connected: true, hotTopics: [] });
    }

    const fortyEightHoursAgo = String(
      Math.floor(Date.now() / 1000) - 48 * 60 * 60
    );

    const messages = await fetchMessages(
      token,
      americas.id,
      200,
      fortyEightHoursAgo
    );

    const hotMessages = messages.filter((m) => {
      const totalReactions = m.reactions.reduce((sum, r) => sum + r.count, 0);
      return m.replyCount >= 5 || totalReactions >= 3;
    });

    const hotTopics = await Promise.all(
      hotMessages.map(async (m) => {
        const totalReactions = m.reactions.reduce(
          (sum, r) => sum + r.count,
          0
        );

        const replies = await fetchThreadReplies(token, americas.id, m.ts);

        const replyAuthorIds = Array.from(
          new Set(replies.slice(0, 3).map((r) => r.user).filter(Boolean))
        );
        const replyAuthors = await Promise.all(
          replyAuthorIds.map((id) =>
            fetchUserProfile(token, id!).catch(() => null)
          )
        );

        const authorProfile = await fetchUserProfile(token, m.user).catch(
          () => null
        );

        const hasCheckmark = replies.some((r) =>
          r.reactions?.some((reaction) => reaction.name === "white_check_mark")
        );
        const sixHoursAgo = Date.now() / 1000 - 6 * 60 * 60;
        const hasRecentReplies = replies.some(
          (r) => parseFloat(r.ts) > sixHoursAgo
        );

        let status: "resolved" | "active" | "needs-input";
        if (hasCheckmark) {
          status = "resolved";
        } else if (hasRecentReplies) {
          status = "active";
        } else {
          status = "needs-input";
        }

        return {
          text: m.text,
          ts: m.ts,
          authorName: authorProfile?.realName ?? "Unknown",
          authorAvatar: authorProfile?.avatar ?? "",
          channelId: americas.id,
          channelName: americas.name,
          replyCount: m.replyCount,
          reactionCount: totalReactions,
          engagement: m.replyCount + totalReactions,
          status,
          topContributors: replyAuthors
            .filter(Boolean)
            .map((a) => ({ name: a!.realName, avatar: a!.avatar })),
          firstReplies: replies.slice(0, 3).map((r) => ({
            text: r.text,
            ts: r.ts,
            authorId: r.user ?? "unknown",
          })),
          deepLink: makeDeepLink(americas.id, m.ts),
        };
      })
    );

    hotTopics.sort((a, b) => b.engagement - a.engagement);

    return NextResponse.json({ connected: true, hotTopics });
  } catch (error) {
    console.error("Failed to fetch hot topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch hot topics" },
      { status: 500 }
    );
  }
}
