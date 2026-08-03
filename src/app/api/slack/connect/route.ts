import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import crypto from "crypto";

function base64url(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

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

  const codeVerifier = base64url(crypto.randomBytes(64));
  const codeChallenge = base64url(
    crypto.createHash("sha256").update(codeVerifier).digest()
  );

  const userScopes = [
    "channels:history",
    "channels:read",
    "groups:history",
    "groups:read",
    "im:history",
    "im:read",
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
  slackUrl.searchParams.set("code_challenge", codeChallenge);
  slackUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(slackUrl.toString());
  response.cookies.set("slack_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return response;
}
