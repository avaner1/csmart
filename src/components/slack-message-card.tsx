"use client";

import { useState } from "react";
import {
  MessageSquare,
  Bookmark,
  ExternalLink,
  SmilePlus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { relativeTime, exactTime } from "@/lib/time";

interface SlackMessageCardProps {
  text: string;
  ts: string;
  authorName: string;
  authorAvatar: string;
  channelName: string;
  replyCount: number;
  reactions: { name: string; count: number }[];
  deepLink: string;
  isSaved: boolean;
  onToggleSave: () => void;
}

export function SlackMessageCard({
  text,
  ts,
  authorName,
  authorAvatar,
  channelName,
  replyCount,
  reactions,
  deepLink,
  isSaved,
  onToggleSave,
}: SlackMessageCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 200;

  return (
    <div className="bg-spotify-card rounded-card border border-spotify-border p-4 hover:bg-spotify-border/30 transition-all duration-200 hover:translate-y-[-1px] hover:shadow-lg hover:shadow-black/20">
      <div className="flex items-start gap-3">
        {authorAvatar ? (
          <img
            src={authorAvatar}
            alt=""
            className="w-9 h-9 rounded-full flex-shrink-0 mt-0.5"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-spotify-border flex-shrink-0 mt-0.5" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-white">
              {authorName}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-spotify-border text-spotify-subtext">
              #{channelName}
            </span>
            <span
              className="text-xs text-spotify-subtext ml-auto flex-shrink-0"
              title={exactTime(ts)}
            >
              {relativeTime(ts)}
            </span>
          </div>

          <div className="relative">
            <p
              className={`text-sm text-spotify-subtext whitespace-pre-wrap break-words ${
                !expanded && isLong ? "line-clamp-3" : ""
              }`}
            >
              {text}
            </p>
            {isLong && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-spotify-green hover:text-spotify-green/80 mt-1 flex items-center gap-0.5"
              >
                {expanded ? (
                  <>
                    Show less <ChevronUp size={12} />
                  </>
                ) : (
                  <>
                    Show more <ChevronDown size={12} />
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 mt-3">
            {replyCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-spotify-subtext bg-spotify-border/50 px-2 py-1 rounded">
                <MessageSquare size={12} />
                {replyCount}
              </span>
            )}

            {reactions.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-spotify-subtext bg-spotify-border/50 px-2 py-1 rounded">
                <SmilePlus size={12} />
                {reactions.reduce((sum, r) => sum + r.count, 0)}
              </span>
            )}

            <div className="flex items-center gap-1 ml-auto">
              <a
                href={deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-card text-spotify-subtext hover:text-white hover:bg-spotify-border transition-colors"
                title="Open in Slack"
              >
                <ExternalLink size={14} />
              </a>
              <button
                onClick={onToggleSave}
                className={`p-1.5 rounded-card transition-colors ${
                  isSaved
                    ? "text-spotify-green hover:text-spotify-green/80"
                    : "text-spotify-subtext hover:text-white hover:bg-spotify-border"
                }`}
                title={isSaved ? "Unsave" : "Save for later"}
              >
                <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
