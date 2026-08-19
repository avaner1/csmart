import { NextRequest, NextResponse } from "next/server";
import {
  getSlackToken,
  fetchChannels,
  fetchMessages,
  enrichMessages,
} from "@/lib/slack";

export async function GET(request: NextRequest) {
  const { token, hiddenChannels } = await getSlackToken();
  if (!token) {
    return NextResponse.json({ connected: false });
  }

  const channelFilter = request.nextUrl.searchParams.get("channel");

  try {
    const allChannels = await fetchChannels(token);
    const channels = allChannels.filter((c) => !hiddenChannels.includes(c.id));

    let targetChannels = channels;
    if (channelFilter) {
      targetChannels = channels.filter((c) => c.id === channelFilter);
    } else {
      const americas = channels.find((c) => c.isAmericasCs);
      if (americas) {
        targetChannels = [americas, ...channels.filter((c) => !c.isAmericasCs).slice(0, 4)];
      } else {
        targetChannels = channels.slice(0, 5);
      }
    }

    const allMessages = await Promise.all(
      targetChannels.map(async (ch) => {
        const msgs = await fetchMessages(token, ch.id, 20);
        return enrichMessages(token, msgs, ch.id, ch.name);
      })
    );

    const messages = allMessages
      .flat()
      .sort((a, b) => parseFloat(b.ts) - parseFloat(a.ts));

    return NextResponse.json({ connected: true, messages });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
