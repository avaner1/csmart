import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL));
  }

  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = process.env.SLACK_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Slack is not configured" },
      { status: 500 }
    );
  }

  const scopes = [
    "channels:history",
    "channels:read",
    "groups:history",
    "groups:read",
    "im:history",
    "im:read",
    "users:read",
    "users:read.email",
    "team:read",
  ].join(",");

  const slackUrl = new URL("https://slack.com/oauth/v2/authorize");
  slackUrl.searchParams.set("client_id", clientId);
  slackUrl.searchParams.set("scope", scopes);
  slackUrl.searchParams.set("redirect_uri", redirectUri);
  slackUrl.searchParams.set("state", user.id);

  return NextResponse.redirect(slackUrl.toString());
}
