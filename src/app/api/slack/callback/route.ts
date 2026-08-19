import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVibeEmail } from "@/lib/auth";
import { ensureDbSetup } from "@/lib/db-setup";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/setup?slack=error", request.url));
  }

  await ensureDbSetup();

  const email = await getVibeEmail();
  if (!email) {
    return NextResponse.redirect(new URL("/setup?slack=error&reason=no-email", request.url));
  }

  try {
    const params: Record<string, string> = {
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      code,
      redirect_uri: process.env.SLACK_REDIRECT_URI!,
    };

    // Include PKCE verifier if cookie exists
    const codeVerifier = request.cookies.get("slack_code_verifier")?.value;
    if (codeVerifier) {
      params.code_verifier = codeVerifier;
    }

    const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params),
    });

    const data = await tokenResponse.json();

    if (!data.ok) {
      console.error("Slack OAuth error:", data.error, JSON.stringify(data));
      return NextResponse.redirect(
        new URL(`/setup?slack=error&reason=${data.error}`, request.url)
      );
    }

    const userToken = data.authed_user?.access_token ?? data.access_token;

    const dbUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (dbUser) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          slackAccessToken: userToken,
          slackTeamName: data.team?.name ?? null,
          slackConnected: true,
        },
      });
    }

    const response = NextResponse.redirect(
      new URL("/setup?slack=success", request.url)
    );
    response.cookies.delete("slack_code_verifier");
    return response;
  } catch (err) {
    console.error("Slack callback error:", err);
    return NextResponse.redirect(
      new URL("/setup?slack=error&reason=exception", request.url)
    );
  }
}
