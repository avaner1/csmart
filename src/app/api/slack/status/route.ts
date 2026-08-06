import { NextResponse } from "next/server";
import { getSlackToken, slackApi } from "@/lib/slack";

export async function GET() {
  const { token } = await getSlackToken();
  if (!token) {
    return NextResponse.json({ connected: false });
  }

  try {
    const data = await slackApi<{ ok: boolean }>(
      token,
      "auth.test",
      {}
    );

    if (!data.ok) {
      return NextResponse.json({ connected: false });
    }

    // Test groups:read by trying to list private channels
    let hasGroupScopes = true;
    try {
      await slackApi(token, "conversations.list", {
        types: "private_channel",
        limit: "1",
      });
    } catch {
      hasGroupScopes = false;
    }

    return NextResponse.json({
      connected: true,
      hasGroupScopes,
      needsReconnect: !hasGroupScopes,
    });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
