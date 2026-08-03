import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL("/setup?slack=error", request.url)
    );
  }

  const codeVerifier = request.cookies.get("slack_code_verifier")?.value;
  if (!codeVerifier) {
    console.error("Slack callback: missing code_verifier cookie");
    return NextResponse.redirect(
      new URL("/setup?slack=error", request.url)
    );
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  try {
    const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code,
        redirect_uri: process.env.SLACK_REDIRECT_URI!,
        code_verifier: codeVerifier,
      }),
    });

    const data = await tokenResponse.json();

    if (!data.ok) {
      console.error("Slack OAuth error:", data.error, JSON.stringify(data));
      return NextResponse.redirect(
        new URL("/setup?slack=error", request.url)
      );
    }

    const userToken = data.authed_user?.access_token ?? data.access_token;

    await prisma.user.update({
      where: { clerkId: clerkUser.id },
      data: {
        slackAccessToken: userToken,
        slackTeamName: data.team?.name ?? null,
        slackConnected: true,
      },
    });

    const response = NextResponse.redirect(
      new URL("/setup?slack=success", request.url)
    );
    response.cookies.delete("slack_code_verifier");
    return response;
  } catch (err) {
    console.error("Slack callback error:", err);
    return NextResponse.redirect(
      new URL("/setup?slack=error", request.url)
    );
  }
}
