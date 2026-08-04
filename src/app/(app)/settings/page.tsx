"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectionCards } from "@/components/connection-cards";
import { BookOfBusiness } from "@/components/book-of-business";

interface DbUser {
  slackConnected: boolean;
  slackTeamName: string | null;
  autoMatchedBook: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);

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
    fetchUser();
  }, []);

  async function handleDisconnectSlack() {
    const res = await fetch("/api/slack/disconnect", { method: "POST" });
    if (res.ok) {
      setDbUser((prev) =>
        prev ? { ...prev, slackConnected: false, slackTeamName: null } : null
      );
      router.refresh();
    }
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
      <p className="text-spotify-subtext mb-8">
        Manage your integrations and preferences.
      </p>

      <h2 className="text-lg font-semibold text-white mb-4">Connections</h2>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <ConnectionCards
          slackConnected={dbUser?.slackConnected ?? false}
          slackTeamName={dbUser?.slackTeamName ?? null}
          onDisconnectSlack={handleDisconnectSlack}
          showDisconnect
        />
      )}

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-white mb-4">
          My Book of Business
        </h2>
        <BookOfBusiness />
      </div>

      <p className="text-xs text-spotify-subtext/50 mt-12 text-center">
        Appearance customized by your team
      </p>
    </div>
  );
}
