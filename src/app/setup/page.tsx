"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { ConnectionCards } from "@/components/connection-cards";
import { ArrowRight } from "lucide-react";

interface DbUser {
  slackConnected: boolean;
  slackTeamName: string | null;
}

export default function SetupPage() {
  const { user: clerkUser, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const slackStatus = searchParams.get("slack");

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/user");
        if (res.ok) {
          const data = await res.json();
          setDbUser(data.user);
        }
      } finally {
        setLoading(false);
      }
    }
    if (isLoaded) fetchUser();
  }, [isLoaded, slackStatus]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-spotify-darkgray flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const firstName = clerkUser?.firstName ?? "there";

  return (
    <div className="min-h-screen bg-spotify-darkgray">
      <div className="h-1 bg-gradient-to-r from-spotify-green/80 to-spotify-green/20" />

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to CSMart, {firstName}
          </h1>
          <p className="text-spotify-subtext text-lg">
            Let&apos;s connect your tools so everything lives in one place.
          </p>
        </div>

        {slackStatus === "success" && (
          <div className="mb-6 px-4 py-3 bg-spotify-green/10 border border-spotify-green/20 rounded-card text-sm text-spotify-green">
            Slack connected successfully!
          </div>
        )}
        {slackStatus === "error" && (
          <div className="mb-6 px-4 py-3 bg-spotify-error/10 border border-spotify-error/20 rounded-card text-sm text-spotify-error">
            Failed to connect Slack. Please try again.
          </div>
        )}

        <ConnectionCards
          slackConnected={dbUser?.slackConnected ?? false}
          slackTeamName={dbUser?.slackTeamName ?? null}
        />

        <div className="mt-10 flex items-center gap-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-spotify-green hover:bg-spotify-green/90 text-black font-semibold rounded-card transition-all duration-200 hover:translate-y-[-1px] hover:shadow-lg hover:shadow-spotify-green/20"
          >
            Get Started
            <ArrowRight size={18} />
          </button>
          {!dbUser?.slackConnected && (
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm text-spotify-subtext hover:text-white transition-colors"
            >
              Skip Slack for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
