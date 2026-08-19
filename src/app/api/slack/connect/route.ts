import { NextResponse } from "next/server";
import { getDbUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const clientId = process.env.SLACK_CLIENT_ID;
    const redirectUri = process.env.SLACK_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: "Slack is not configured" },
        { status: 500 }
      );
    }

    const userScopes = [
      "channels:history",
      "channels:read",
      "groups:history",
      "groups:read",
      "im:history",
      "im:read",
      "search:read",
      "users:read",
      "users:read.email",
      "team:read",
      "stars:read",
    ].join(",");

    const slackUrl = new URL("https://slack.com/oauth/v2/authorize");
    slackUrl.searchParams.set("client_id", clientId);
    slackUrl.searchParams.set("user_scope", userScopes);
    slackUrl.searchParams.set("redirect_uri", redirectUri);
    slackUrl.searchParams.set("state", user.id);

    return NextResponse.redirect(slackUrl.toString(), { status: 302 });
  } catch (e) {
    console.error("Slack connect error:", e);
    return NextResponse.json({ error: "Failed to start Slack OAuth", details: String(e) }, { status: 500 });
  }
}
