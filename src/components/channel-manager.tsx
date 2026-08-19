"use client";

import { useState, useEffect } from "react";
import { MessageSquare, RotateCcw, ChevronDown, ChevronUp, Eye } from "lucide-react";

interface Channel {
  id: string;
  name: string;
  isAmericasCs: boolean;
  hidden: boolean;
}

const PRIORITY_CHANNELS = [
  "americas-customer-success",
  "sax-ads-questions",
  "global-customer-success",
  "nyc_csm_crew",
  "csm-ai-corner",
  "the-csm-label",
];

export function ChannelManager() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [showHidden, setShowHidden] = useState(false);
  const [toast, setToast] = useState<{ name: string; id: string } | null>(null);
  const [firstVisit, setFirstVisit] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("csmart_channels_seen");
    if (!seen) {
      setFirstVisit(true);
      localStorage.setItem("csmart_channels_seen", "true");
    }

    fetch("/api/slack/channels-manage")
      .then((r) => r.json())
      .then((data) => {
        if (data.connected === false) {
          setConnected(false);
        } else {
          setChannels(data.channels ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function toggleChannel(channelId: string, action: "hide" | "show") {
    const channel = channels.find((c) => c.id === channelId);

    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, hidden: action === "hide" } : c))
    );

    if (action === "hide" && channel) {
      setToast({ name: channel.name, id: channelId });
      setTimeout(() => setToast(null), 4000);
    }

    await fetch("/api/slack/channels-manage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId, action }),
    });
  }

  async function resetAll() {
    setChannels((prev) => prev.map((c) => ({ ...c, hidden: false })));
    await fetch("/api/slack/channels-manage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
  }

  function undoHide() {
    if (toast) {
      toggleChannel(toast.id, "show");
      setToast(null);
    }
  }

  if (loading) {
    return (
      <div className="bg-spotify-card rounded-container border border-spotify-border p-6">
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="bg-spotify-card rounded-container border border-spotify-border p-6">
        <p className="text-sm text-spotify-subtext text-center">
          Connect Slack to manage your channels.
        </p>
      </div>
    );
  }

  const visibleChannels = channels.filter((c) => !c.hidden);
  const hiddenChannels = channels.filter((c) => c.hidden);
  const priorityChannels = visibleChannels.filter((c) => PRIORITY_CHANNELS.includes(c.name));
  const otherChannels = visibleChannels
    .filter((c) => !PRIORITY_CHANNELS.includes(c.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="bg-spotify-card rounded-container border border-spotify-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <MessageSquare size={15} className="text-spotify-green" />
            Manage Slack Channels
          </h3>
          <p className="text-xs text-spotify-subtext mt-1">
            All your Slack channels are synced by default. Hide any channels you don&apos;t need in your feed.
          </p>
        </div>
        <span className="text-xs text-spotify-subtext">
          Showing {visibleChannels.length} of {channels.length}
        </span>
      </div>

      {firstVisit && (
        <div className="mb-4 px-3 py-2 bg-spotify-green/10 border border-spotify-green/20 rounded-card">
          <p className="text-xs text-spotify-green">
            Everything is already synced. Only hide channels if they&apos;re adding noise to your feed.
          </p>
        </div>
      )}

      {/* Priority Channels */}
      {priorityChannels.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-spotify-subtext font-medium mb-2 uppercase tracking-wider">
            Priority Channels
          </p>
          <div className="space-y-1">
            {priorityChannels.map((c) => (
              <ChannelRow key={c.id} channel={c} onToggle={toggleChannel} />
            ))}
          </div>
        </div>
      )}

      {/* Other Channels */}
      {otherChannels.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-spotify-subtext font-medium mb-2 uppercase tracking-wider">
            Other Channels
          </p>
          <div className="space-y-1">
            {otherChannels.map((c) => (
              <ChannelRow key={c.id} channel={c} onToggle={toggleChannel} />
            ))}
          </div>
        </div>
      )}

      {/* Hidden Channels */}
      {hiddenChannels.length > 0 && (
        <div className="mt-4 pt-4 border-t border-spotify-border/50">
          <button
            onClick={() => setShowHidden(!showHidden)}
            className="flex items-center gap-2 text-xs text-spotify-subtext hover:text-white transition-colors mb-2"
          >
            {showHidden ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Hidden Channels ({hiddenChannels.length})
          </button>

          {showHidden && (
            <div className="space-y-1">
              {hiddenChannels.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-card bg-spotify-border/10 opacity-60">
                  <span className="text-sm text-spotify-subtext">#{c.name}</span>
                  <button
                    onClick={() => toggleChannel(c.id, "show")}
                    className="text-xs text-spotify-green hover:underline flex items-center gap-1"
                  >
                    <Eye size={11} /> Show again
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reset + note */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-spotify-subtext/50">
          Hidden channels can be added back anytime from this page.
        </p>
        {hiddenChannels.length > 0 && (
          <button
            onClick={resetAll}
            className="text-xs text-spotify-subtext hover:text-white flex items-center gap-1 transition-colors"
          >
            <RotateCcw size={11} /> Reset All
          </button>
        )}
      </div>

      {/* Undo toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-spotify-card border border-spotify-border rounded-card px-4 py-3 shadow-xl z-50 flex items-center gap-3">
          <p className="text-sm text-spotify-subtext">
            Hidden <span className="text-white">#{toast.name}</span> from your feed.
          </p>
          <button
            onClick={undoHide}
            className="text-sm text-spotify-green hover:underline font-medium"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

function ChannelRow({ channel, onToggle }: { channel: Channel; onToggle: (id: string, action: "hide" | "show") => void }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-card hover:bg-spotify-border/20 transition-colors">
      <span className="text-sm text-white">#{channel.name}</span>
      <button
        onClick={() => onToggle(channel.id, channel.hidden ? "show" : "hide")}
        className={`w-9 h-5 rounded-full transition-colors relative ${
          channel.hidden ? "bg-spotify-border" : "bg-spotify-green"
        }`}
      >
        <div
          className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all"
          style={{ left: channel.hidden ? "2px" : "18px" }}
        />
      </button>
    </div>
  );
}
