"use client";

import { useState } from "react";
import {
  MessageSquare,
  SmilePlus,
  Bookmark,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { relativeTime, exactTime } from "@/lib/time";

interface HotTopicCardProps {
  text: string;
  ts: string;
  authorName: string;
  authorAvatar: string;
  channelName: string;
  replyCount: number;
  reactionCount: number;
  status: "resolved" | "active" | "needs-input";
  topContributors: { name: string; avatar: string }[];
  firstReplies: { text: string; ts: string; authorId: string }[];
  deepLink: string;
  isSaved: boolean;
  onToggleSave: () => void;
}

const statusConfig = {
  resolved: {
    label: "Resolved",
    className: "bg-spotify-green/10 text-spotify-green",
  },
  active: {
    label: "Active",
    className: "bg-spotify-warning/10 text-spotify-warning",
  },
  "needs-input": {
    label: "Needs Input",
    className: "bg-spotify-error/10 text-spotify-error",
  },
};

export function HotTopicCard({
  text,
  ts,
  authorName,
  authorAvatar,
  channelName,
  replyCount,
  reactionCount,
  status,
  topContributors,
  firstReplies,
  deepLink,
  isSaved,
  onToggleSave,
}: HotTopicCardProps) {
  const [expanded, setExpanded] = useState(false);
  const statusInfo = statusConfig[status];

  return (
    <div className="bg-spotify-card rounded-container border border-spotify-border p-5 hover:bg-spotify-border/30 transition-all duration-200 hover:translate-y-[-1px] hover:shadow-lg hover:shadow-black/20">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium px-2 py-0.5 rounded bg-spotify-error/10 text-spotify-error">
          Hot Topic
        </span>
        <span className={`text-xs px-2 py-0.5 rounded ${statusInfo.className}`}>
          {statusInfo.label}
        </span>
        <span className="text-xs text-spotify-subtext ml-auto" title={exactTime(ts)}>
          {relativeTime(ts)}
        </span>
      </div>

      <div className="flex items-start gap-3 mb-3">
        {authorAvatar ? (
          <img
            src={authorAvatar}
            alt=""
            className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-spotify-border flex-shrink-0 mt-0.5" />
        )}
        <div className="min-w-0">
          <span className="text-sm font-semibold text-white">{authorName}</span>
          <span className="text-xs text-spotify-subtext ml-2">
            in #{channelName}
          </span>
          <p className="text-sm text-spotify-subtext mt-1 whitespace-pre-wrap break-words line-clamp-3">
            {text}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span className="inline-flex items-center gap-1 text-xs text-spotify-subtext bg-spotify-border/50 px-2 py-1 rounded">
          <MessageSquare size={12} />
          {replyCount} replies
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-spotify-subtext bg-spotify-border/50 px-2 py-1 rounded">
          <SmilePlus size={12} />
          {reactionCount} reactions
        </span>

        {topContributors.length > 0 && (
          <div className="flex items-center -space-x-2 ml-2">
            {topContributors.map((c, i) => (
              <img
                key={i}
                src={c.avatar}
                alt={c.name}
                title={c.name}
                className="w-6 h-6 rounded-full border-2 border-spotify-card"
              />
            ))}
          </div>
        )}
      </div>

      {firstReplies.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-spotify-green hover:text-spotify-green/80 flex items-center gap-1 mb-2"
          >
            {expanded ? (
              <>
                Hide replies <ChevronUp size={12} />
              </>
            ) : (
              <>
                Show replies <ChevronDown size={12} />
              </>
            )}
          </button>

          {expanded && (
            <div className="space-y-2 pl-4 border-l-2 border-spotify-border">
              {firstReplies.map((reply, i) => (
                <div key={i} className="text-sm">
                  <p className="text-spotify-subtext whitespace-pre-wrap break-words line-clamp-2">
                    {reply.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-spotify-border/50">
        <a
          href={deepLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-spotify-subtext hover:text-white transition-colors"
        >
          <ExternalLink size={13} />
          Open in Slack
        </a>
        <button
          onClick={onToggleSave}
          className={`ml-auto p-1.5 rounded-card transition-colors ${
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
  );
}
