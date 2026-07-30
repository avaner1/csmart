import { NextResponse } from "next/server";
import { syncUser } from "@/lib/sync-user";

export async function POST() {
  try {
    const user = await syncUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Failed to sync user:", error);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
}
