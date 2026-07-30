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
      }),
    });

    const data = await tokenResponse.json();

    if (!data.ok) {
      console.error("Slack OAuth error:", data.error);
      return NextResponse.redirect(
        new URL("/setup?slack=error", request.url)
      );
    }

    await prisma.user.update({
      where: { clerkId: clerkUser.id },
      data: {
        slackAccessToken: data.access_token,
        slackTeamName: data.team?.name ?? null,
        slackConnected: true,
      },
    });

    return NextResponse.redirect(
      new URL("/setup?slack=success", request.url)
    );
  } catch (err) {
    console.error("Slack callback error:", err);
    return NextResponse.redirect(
      new URL("/setup?slack=error", request.url)
    );
  }
}
