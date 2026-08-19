import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDbUser } from "@/lib/auth";
import { getSlackToken, fetchChannels } from "@/lib/slack";

export async function GET() {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { token } = await getSlackToken();
  if (!token) return NextResponse.json({ connected: false });

  try {
    const channels = await fetchChannels(token);
    const hidden = user.hiddenChannels ?? [];

    return NextResponse.json({
      connected: true,
      channels: channels.map((c) => ({
        id: c.id,
        name: c.name,
        isAmericasCs: c.isAmericasCs,
        hidden: hidden.includes(c.id),
      })),
      hiddenCount: hidden.length,
      totalCount: channels.length,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getDbUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { channelId, action } = await request.json();

  if (action === "hide") {
    const current = user.hiddenChannels ?? [];
    if (!current.includes(channelId)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { hiddenChannels: [...current, channelId] },
      });
    }
  } else if (action === "show") {
    const current = user.hiddenChannels ?? [];
    await prisma.user.update({
      where: { id: user.id },
      data: { hiddenChannels: current.filter((id) => id !== channelId) },
    });
  } else if (action === "reset") {
    await prisma.user.update({
      where: { id: user.id },
      data: { hiddenChannels: [] },
    });
  }

  return NextResponse.json({ success: true });
}
