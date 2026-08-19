import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDbSetup } from "@/lib/db-setup";

export async function POST(request: NextRequest) {
  try {
    await ensureDbSetup();

    const contentType = request.headers.get("content-type") ?? "";
    let payload: Record<string, unknown>;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      const payloadStr = formData.get("payload");
      if (!payloadStr) return new Response("", { status: 200 });
      payload = JSON.parse(payloadStr as string);
    } else {
      payload = await request.json();
    }

    console.log("[shortcut] type:", payload.type);

    // URL verification challenge
    if (payload.type === "url_verification") {
      return NextResponse.json({ challenge: payload.challenge });
    }

    // Message shortcut
    if (payload.type === "message_action") {
      const message = payload.message as Record<string, string> | undefined;
      const channel = payload.channel as Record<string, string> | undefined;
      const triggeredUser = payload.user as Record<string, string> | undefined;

      if (!message || !channel) {
        console.log("[shortcut] No message or channel in payload");
        return new Response("", { status: 200 });
      }

      const messageText = message.text ?? "(no text)";
      const messageTs = message.ts;
      const channelId = channel.id;
      const channelName = channel.name ?? channelId;
      const slackUsername = triggeredUser?.username ?? "";

      console.log("[shortcut] Saving message from #" + channelName, "for user:", slackUsername);

      // Find CSmart user — try email prefix match
      let dbUser = null;
      if (slackUsername) {
        dbUser = await prisma.user.findFirst({
          where: { email: { startsWith: slackUsername, mode: "insensitive" } },
        });
      }

      if (!dbUser) {
        console.warn("[shortcut] No CSmart user found for:", slackUsername);
        // Still return 200 so Slack doesn't retry
        return new Response("", { status: 200 });
      }

      // Check duplicate
      const existing = await prisma.savedItem.findFirst({
        where: { userId: dbUser.id, sourceType: "slack", sourceId: messageTs },
      });

      if (existing) {
        console.log("[shortcut] Already saved");
        return new Response("", { status: 200 });
      }

      const deepLink = `https://slack.com/app_redirect?channel=${channelId}&message=${messageTs}`;

      await prisma.savedItem.create({
        data: {
          userId: dbUser.id,
          sourceType: "slack",
          sourceId: messageTs,
          title: `Message in #${channelName}`.slice(0, 200),
          content: messageText,
          sourceUrl: deepLink,
          tags: ["slack-shortcut"],
        },
      });

      console.log("[shortcut] Saved successfully for:", dbUser.email);
      return new Response("", { status: 200 });
    }

    return new Response("", { status: 200 });
  } catch (e) {
    console.error("[shortcut] Error:", e);
    // Always return 200 to Slack to prevent retries
    return new Response("", { status: 200 });
  }
}
