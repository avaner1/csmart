"use client";

import {
  CheckCircle2,
  MessageSquare,
  Mail,
  Calendar,
  ExternalLink,
} from "lucide-react";

interface ConnectionCardsProps {
  slackConnected: boolean;
  slackTeamName: string | null;
  onDisconnectSlack?: () => void;
  showDisconnect?: boolean;
}

export function ConnectionCards({
  slackConnected,
  slackTeamName,
  onDisconnectSlack,
  showDisconnect = false,
}: ConnectionCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Google Account */}
      <div className="bg-spotify-card rounded-container border border-spotify-border p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-card bg-spotify-green/10 flex items-center justify-center">
            <CheckCircle2 size={22} className="text-spotify-green" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Google Account</p>
            <p className="text-xs text-spotify-green">Connected via sign-in</p>
          </div>
        </div>
        <p className="text-sm text-spotify-subtext">
          Your Spotify Google account is linked
        </p>
      </div>

      {/* Slack */}
      <div className="bg-spotify-card rounded-container border border-spotify-border p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-card flex items-center justify-center ${
              slackConnected ? "bg-spotify-green/10" : "bg-spotify-border"
            }`}
          >
            {slackConnected ? (
              <CheckCircle2 size={22} className="text-spotify-green" />
            ) : (
              <MessageSquare size={22} className="text-spotify-subtext" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Slack</p>
            <p
              className={`text-xs ${
                slackConnected ? "text-spotify-green" : "text-spotify-subtext"
              }`}
            >
              {slackConnected
                ? `Connected${slackTeamName ? ` · ${slackTeamName}` : ""}`
                : "Not connected"}
            </p>
          </div>
        </div>
        <p className="text-sm text-spotify-subtext">
          Access team channels, save messages, see hot topics
        </p>
        {slackConnected ? (
          showDisconnect && onDisconnectSlack ? (
            <button
              onClick={onDisconnectSlack}
              className="mt-auto text-sm text-spotify-subtext hover:text-spotify-error transition-colors text-left"
            >
              Disconnect Slack
            </button>
          ) : null
        ) : (
          <a
            href="/api/slack/connect"
            className="mt-auto inline-flex items-center gap-2 px-4 py-2.5 bg-spotify-green hover:bg-spotify-green/90 text-black text-sm font-semibold rounded-card transition-all duration-200 hover:translate-y-[-1px] hover:shadow-lg hover:shadow-spotify-green/20 w-fit"
          >
            Connect Slack
            <ExternalLink size={14} />
          </a>
        )}
      </div>

      {/* Gmail & Calendar */}
      <div className="bg-spotify-card rounded-container border border-spotify-border p-6 flex flex-col gap-4 opacity-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-card bg-spotify-border flex items-center justify-center">
            <div className="flex gap-0.5">
              <Mail size={14} className="text-spotify-subtext" />
              <Calendar size={14} className="text-spotify-subtext" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              Gmail & Calendar
            </p>
            <p className="text-xs text-spotify-subtext">Coming Soon</p>
          </div>
        </div>
        <p className="text-sm text-spotify-subtext">
          Direct inbox and calendar integration is on the way
        </p>
        <p className="mt-auto text-xs text-spotify-subtext italic">
          We&apos;ll notify you when this is ready
        </p>
      </div>
    </div>
  );
}
