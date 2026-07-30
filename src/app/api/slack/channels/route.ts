import { NextResponse } from "next/server";
import { getSlackToken, fetchChannels } from "@/lib/slack";

export async function GET() {
  const { token } = await getSlackToken();
  if (!token) {
    return NextResponse.json({ connected: false });
  }

  try {
    const channels = await fetchChannels(token);
    return NextResponse.json({ connected: true, channels });
  } catch (error) {
    console.error("Failed to fetch channels:", error);
    return NextResponse.json(
      { error: "Failed to fetch channels" },
      { status: 500 }
    );
  }
}
