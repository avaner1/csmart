"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Check } from "lucide-react";
import { ConnectionCards } from "@/components/connection-cards";
import { BookOfBusiness } from "@/components/book-of-business";
import { CoverageMode } from "@/components/coverage-mode";
import { ChannelManager } from "@/components/channel-manager";

interface DbUser {
  slackConnected: boolean;
  slackTeamName: string | null;
  autoMatchedBook: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [editName, setEditName] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/user");
        if (res.ok) {
          const data = await res.json();
          setDbUser(data.user);
          setUserName(data.user.name ?? "");
          setEditName("");
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

      {/* Display Name */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User size={18} />
          Profile
        </h2>
        <div className="bg-spotify-card rounded-container border border-spotify-border p-6">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-sm text-spotify-subtext">
              Currently showing as: <span className="text-white font-medium">{userName}</span>
            </p>
          </div>
          <label className="block text-xs text-spotify-subtext mb-1">Display Name</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={editName}
              onChange={(e) => { setEditName(e.target.value); setNameSaved(false); }}
              placeholder={userName || "Enter your preferred name"}
              className="flex-1 bg-spotify-border/50 border border-spotify-border rounded-card px-3 py-2 text-sm text-white placeholder:text-spotify-subtext focus:border-spotify-green focus:outline-none"
            />
            <button
              onClick={async () => {
                setNameSaving(true);
                await fetch("/api/user", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: editName.trim() }),
                });
                setNameSaving(false);
                setNameSaved(true);
                if (editName.trim()) setUserName(editName.trim());
                setTimeout(() => setNameSaved(false), 3000);
              }}
              disabled={nameSaving}
              className="px-4 py-2 bg-spotify-green hover:bg-spotify-green/90 text-black text-sm font-semibold rounded-card transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {nameSaved ? <><Check size={14} /> Saved</> : nameSaving ? "Saving..." : "Save"}
            </button>
          </div>
          <p className="text-xs text-spotify-subtext mt-2">
            Override how your name appears across CSmart. Leave blank to use the auto-detected name.
          </p>
        </div>
      </div>

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
          Slack Channels
        </h2>
        <ChannelManager />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-white mb-4">
          My Book of Business
        </h2>
        <BookOfBusiness />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-white mb-4">
          Coverage Mode
        </h2>
        <CoverageMode />
      </div>

      <p className="text-xs text-spotify-subtext/50 mt-12 text-center">
        Appearance customized by your team
      </p>
    </div>
  );
}
