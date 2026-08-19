"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  ExternalLink,
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Mail,
  Settings,
  Zap,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { HotTopicCard } from "@/components/hot-topic-card";
import { SlackMessageCard } from "@/components/slack-message-card";
import { relativeTime } from "@/lib/time";
import { useSavedItems } from "@/lib/use-saved-items";

interface MyUpdate {
  text: string;
  ts: string;
  authorName: string;
  authorAvatar: string;
  channelId: string;
  channelName: string;
  replyCount: number;
  reactions: { name: string; count: number }[];
  deepLink: string;
  matchedKeyword: string | null;
  urgency: string;
}

interface AdminItem {
  id: string;
  title: string;
  description: string;
  date: string;
  itemType: string;
  category: string;
  priority: string;
  link: string | null;
}

interface DigestTraining {
  id: string;
  title: string;
  sourceUrl: string;
  dueDate: string;
  category: string;
  isRequired: boolean;
  myStatus: string;
}

interface HotTopic {
  text: string;
  ts: string;
  authorName: string;
  authorAvatar: string;
  channelId: string;
  channelName: string;
  replyCount: number;
  reactionCount: number;
  engagement: number;
  status: "resolved" | "active" | "needs-input";
  topContributors: { name: string; avatar: string }[];
  firstReplies: { text: string; ts: string; authorId: string }[];
  deepLink: string;
}

interface SlackMsg {
  text: string;
  ts: string;
  authorName: string;
  authorAvatar: string;
  channelId: string;
  channelName: string;
  replyCount: number;
  reactions: { name: string; count: number }[];
  deepLink: string;
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-spotify-error",
  high: "bg-spotify-warning",
  normal: "bg-spotify-green",
  low: "bg-spotify-subtext",
};

const TYPE_LABELS: Record<string, string> = {
  "new-release": "New Release",
  deprecation: "Deprecation",
  deadline: "Deadline",
  training: "Training",
  survey: "Survey",
  "all-hands": "All-Hands",
  general: "General",
};

const URGENCY_CONFIG: Record<string, { label: string; color: string; defaultOpen: boolean }> = {
  urgent: { label: "Urgent", color: "text-spotify-error", defaultOpen: true },
  high: { label: "High", color: "text-spotify-warning", defaultOpen: true },
  normal: { label: "Normal", color: "text-spotify-green", defaultOpen: false },
  low: { label: "Low", color: "text-spotify-subtext", defaultOpen: false },
};

export default function DigestPage() {
  const [myUpdates, setMyUpdates] = useState<MyUpdate[]>([]);
  const [myUpdatesStatus, setMyUpdatesStatus] = useState<{ connected: boolean; hasBook: boolean } | null>(null);
  const [todayItems, setTodayItems] = useState<AdminItem[]>([]);
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [hotTopicsConnected, setHotTopicsConnected] = useState(true);
  const [announcements, setAnnouncements] = useState<AdminItem[]>([]);
  const [digestTrainings, setDigestTrainings] = useState<DigestTraining[]>([]);
  const [updatingTrainingId, setUpdatingTrainingId] = useState<string | null>(null);
  const [slackMessages, setSlackMessages] = useState<SlackMsg[]>([]);
  const [slackConnected, setSlackConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["urgent", "high"]));
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());
  const { isSaved, toggleSave } = useSavedItems();

  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const loadChecklist = useCallback(() => {
    const key = `csmart_checklist_${new Date().toISOString().slice(0, 10)}`;
    const stored = localStorage.getItem(key);
    if (stored) setCheckedItems(new Set(JSON.parse(stored)));
  }, []);

  const saveChecklist = useCallback(
    (items: Set<string>) => {
      const key = `csmart_checklist_${new Date().toISOString().slice(0, 10)}`;
      localStorage.setItem(key, JSON.stringify(Array.from(items)));
    },
    []
  );

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const [updatesRes, timelineRes, hotRes, messagesRes, trainRes] = await Promise.allSettled([
      fetch("/api/slack/my-updates").then((r) => r.json()),
      fetch("/api/timeline").then((r) => r.json()),
      fetch("/api/slack/hot-topics").then((r) => r.json()),
      fetch("/api/slack/messages").then((r) => r.json()),
      fetch("/api/trainings").then((r) => r.json()),
    ]);

    if (updatesRes.status === "fulfilled") {
      const d = updatesRes.value;
      setMyUpdatesStatus({ connected: d.connected !== false, hasBook: d.hasBook !== false });
      setMyUpdates(d.updates ?? []);
      // Debug: log match status
      console.log("[Digest] Book status:", { connected: d.connected, hasBook: d.hasBook, updateCount: (d.updates ?? []).length });
    }

    // Debug: log user's book data
    fetch("/api/book").then(r => r.json()).then(bookData => {
      console.log("[Digest] Book data:", {
        autoMatched: bookData.autoMatched,
        vertical: bookData.vertical,
        totalAccounts: bookData.totalAccounts,
        keywordCount: (bookData.keywords ?? []).length,
        keywords: (bookData.keywords ?? []).slice(0, 10),
      });
      if (!bookData.autoMatched) {
        console.warn("[Digest] User not auto-matched to CsmRoster. Check name/email alignment.");
      }
    }).catch(() => {});

    if (timelineRes.status === "fulfilled") {
      const items: AdminItem[] = timelineRes.value.items ?? [];
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      setTodayItems(
        items.filter((i) => {
          const d = new Date(i.date);
          return d >= todayStart && d <= todayEnd;
        })
      );

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      setAnnouncements(
        items.filter(
          (i) => i.category === "announcements" && new Date(i.date) >= sevenDaysAgo
        )
      );
    }

    if (hotRes.status === "fulfilled") {
      setHotTopicsConnected(hotRes.value.connected !== false);
      setHotTopics(hotRes.value.hotTopics ?? []);
    }

    if (messagesRes.status === "fulfilled") {
      setSlackConnected(messagesRes.value.connected !== false);
      setSlackMessages(messagesRes.value.messages ?? []);
    }

    if (trainRes.status === "fulfilled") {
      setDigestTrainings(trainRes.value.trainings ?? []);
    }

    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    loadChecklist();
  }, [fetchAll, loadChecklist]);

  function toggleCheck(id: string) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveChecklist(next);
      return next;
    });
  }

  function toggleGroup(group: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  function toggleChannel(ch: string) {
    setExpandedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(ch)) next.delete(ch);
      else next.add(ch);
      return next;
    });
  }

  const minutesAgo = Math.max(
    0,
    Math.round((Date.now() - lastUpdated.getTime()) / 60000)
  );

  const updatesGrouped: Record<string, MyUpdate[]> = {};
  for (const u of myUpdates) {
    if (!updatesGrouped[u.urgency]) updatesGrouped[u.urgency] = [];
    updatesGrouped[u.urgency].push(u);
  }

  const channelGroups: Record<string, SlackMsg[]> = {};
  for (const msg of slackMessages) {
    if (!channelGroups[msg.channelName]) channelGroups[msg.channelName] = [];
    if (channelGroups[msg.channelName].length < 5) {
      channelGroups[msg.channelName].push(msg);
    }
  }
  const sortedChannels = Object.entries(channelGroups).sort(([a], [b]) => {
    if (a === "americas-customer-success") return -1;
    if (b === "americas-customer-success") return 1;
    return a.localeCompare(b);
  });

  // Auto-expand americas-customer-success
  useEffect(() => {
    if (sortedChannels.length > 0 && sortedChannels[0][0] === "americas-customer-success") {
      setExpandedChannels((prev) => {
        if (prev.size === 0) return new Set(["americas-customer-success"]);
        return prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slackMessages]);

  if (loading) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-white mb-2">Daily Digest</h1>
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Daily Digest</h1>
            <p className="text-spotify-subtext text-sm">{todayStr}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-spotify-subtext">
              Updated {minutesAgo === 0 ? "just now" : `${minutesAgo}m ago`}
            </span>
            <button
              onClick={fetchAll}
              className="p-2 rounded-card text-spotify-subtext hover:text-white hover:bg-spotify-card transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1 — Relevant to Your Book */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Zap size={16} className="text-spotify-green" />
          Relevant to Your Book
        </h2>

        {!myUpdatesStatus?.connected ? (
          <SlackPrompt />
        ) : !myUpdatesStatus?.hasBook ? (
          <div className="bg-spotify-card rounded-container border border-spotify-border p-6 text-center">
            <Zap size={24} className="text-spotify-subtext mx-auto mb-3" />
            <p className="text-sm text-white font-medium mb-1">
              No book of business set up yet
            </p>
            <p className="text-sm text-spotify-subtext mb-3">
              Set up your book of business in Settings to see personalized Slack updates here.
            </p>
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 text-sm text-spotify-green hover:underline"
            >
              <Settings size={14} /> Go to Settings
            </Link>
          </div>
        ) : myUpdates.length === 0 ? (
          <div className="bg-spotify-card rounded-container border border-spotify-border p-6 text-center">
            <p className="text-sm text-spotify-subtext">
              No updates matching your book right now. Check back later — this section shows Slack messages mentioning your accounts and counterparts.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {(["urgent", "high", "normal", "low"] as const).map((level) => {
              const group = updatesGrouped[level];
              if (!group || group.length === 0) return null;
              const cfg = URGENCY_CONFIG[level];
              const isOpen = openGroups.has(level);

              return (
                <div key={level} className="bg-spotify-card rounded-container border border-spotify-border overflow-hidden">
                  <button
                    onClick={() => toggleGroup(level)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-spotify-border/20 transition-colors"
                  >
                    <span className={`text-sm font-medium ${cfg.color}`}>
                      {cfg.label} ({group.length})
                    </span>
                    {isOpen ? <ChevronUp size={14} className="text-spotify-subtext" /> : <ChevronDown size={14} className="text-spotify-subtext" />}
                  </button>

                  {isOpen && (
                    <div className="border-t border-spotify-border/50 divide-y divide-spotify-border/30">
                      {group.map((u) => (
                        <div key={u.ts} className="px-4 py-3 flex items-start gap-3">
                          {u.authorAvatar ? (
                            <img src={u.authorAvatar} alt="" className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-spotify-border flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-medium text-white">{u.authorName}</span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-spotify-border text-spotify-subtext">#{u.channelName}</span>
                              <span className="text-xs text-spotify-subtext ml-auto flex-shrink-0">
                                {relativeTime(u.ts)}
                              </span>
                            </div>
                            <p className="text-sm text-spotify-subtext line-clamp-2">{u.text}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              {u.matchedKeyword && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-spotify-green/15 text-spotify-green">
                                  Matched: {u.matchedKeyword}
                                </span>
                              )}
                              <div className="ml-auto flex items-center gap-1">
                                <a href={u.deepLink} target="_blank" rel="noopener noreferrer" className="p-1 rounded text-spotify-subtext hover:text-white transition-colors">
                                  <ExternalLink size={13} />
                                </a>
                                <button
                                  onClick={() => toggleSave({ sourceType: "slack", sourceId: u.ts, title: u.text.slice(0, 100), content: u.text, sourceUrl: u.deepLink })}
                                  className={`p-1 rounded transition-colors ${isSaved("slack", u.ts) ? "text-spotify-green" : "text-spotify-subtext hover:text-white"}`}
                                >
                                  <Bookmark size={13} fill={isSaved("slack", u.ts) ? "currentColor" : "none"} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 2 — Today's Priorities */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3">
          Today&apos;s Priorities
        </h2>

        {todayItems.length === 0 ? (
          <div className="bg-spotify-card rounded-container border border-spotify-border p-6">
            <p className="text-sm text-spotify-subtext text-center">
              No deadlines today. Focus on your accounts
            </p>
          </div>
        ) : (
          <div className="bg-spotify-card rounded-container border border-spotify-border divide-y divide-spotify-border/30">
            {todayItems.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-spotify-border/20 transition-colors"
              >
                <button
                  onClick={() => toggleCheck(item.id)}
                  className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                    checkedItems.has(item.id)
                      ? "bg-spotify-green border-spotify-green"
                      : "border-spotify-border hover:border-spotify-subtext"
                  }`}
                >
                  {checkedItems.has(item.id) && <Check size={12} className="text-black" />}
                </button>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[item.priority] ?? "bg-spotify-subtext"}`} />
                <span className={`text-sm flex-1 ${checkedItems.has(item.id) ? "line-through text-spotify-subtext" : "text-white"}`}>
                  {item.title}
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-spotify-border text-spotify-subtext flex-shrink-0">
                  {TYPE_LABELS[item.itemType] ?? item.itemType}
                </span>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="p-1 text-spotify-subtext hover:text-white" onClick={(e) => e.stopPropagation()}>
                    <ExternalLink size={13} />
                  </a>
                )}
              </label>
            ))}
          </div>
        )}
      </section>

      {/* Training Reminders */}
      <TrainingReminders
        trainings={digestTrainings}
        updatingId={updatingTrainingId}
        onMarkDone={async (id) => {
          setUpdatingTrainingId(id);
          await fetch(`/api/trainings/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "completed" }),
          });
          setUpdatingTrainingId(null);
          fetchAll();
        }}
      />

      {/* SECTION 3 — Hot Topics */}
      <section>
        <h2 className="text-base font-semibold text-white mb-1">
          Hot Topics in #americas-customer-success
        </h2>
        <p className="text-xs text-spotify-subtext mb-3">
          Questions and discussions with the most engagement in the last 48 hours.
        </p>

        {!hotTopicsConnected ? (
          <SlackPrompt />
        ) : hotTopics.length === 0 ? (
          <div className="bg-spotify-card rounded-container border border-spotify-border p-6 text-center">
            <MessageSquare size={20} className="text-spotify-subtext mx-auto mb-2" />
            <p className="text-sm text-spotify-subtext">
              No trending discussions in the last 48 hours. Hot topics appear when threads get 5+ replies or 3+ reactions.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {hotTopics.map((topic) => (
              <HotTopicCard
                key={topic.ts}
                {...topic}
                isSaved={isSaved("slack", topic.ts)}
                onToggleSave={() =>
                  toggleSave({
                    sourceType: "slack",
                    sourceId: topic.ts,
                    title: topic.text.slice(0, 100),
                    content: topic.text,
                    sourceUrl: topic.deepLink,
                  })
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* SECTION 4 — Team Announcements */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3">
          Team Announcements
        </h2>

        <div className="bg-spotify-card/50 rounded-card border border-spotify-border/50 px-4 py-3 mb-3">
          <p className="text-xs text-spotify-subtext flex items-center gap-2">
            <Mail size={13} className="text-spotify-green flex-shrink-0" />
            Gmail integration coming soon — team emails from americas-csm@spotify.com will appear here automatically.
          </p>
        </div>

        {announcements.length === 0 ? (
          <div className="bg-spotify-card rounded-container border border-spotify-border p-6 text-center">
            <p className="text-sm text-spotify-subtext">
              No team announcements in the last 7 days. Admins can post announcements from the Admin panel.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {announcements.map((item) => (
              <div key={item.id} className="bg-spotify-card rounded-card border border-spotify-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="text-xs text-spotify-subtext mt-0.5">
                      {new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                    <p className="text-sm text-spotify-subtext mt-1 line-clamp-2">{item.description}</p>
                  </div>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded text-spotify-subtext hover:text-white hover:bg-spotify-border transition-colors flex-shrink-0">
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 5 — Slack Catch-Up */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3">
          Slack Catch-Up
        </h2>

        {!slackConnected ? (
          <SlackPrompt />
        ) : sortedChannels.length === 0 ? (
          <div className="bg-spotify-card rounded-container border border-spotify-border p-6">
            <p className="text-sm text-spotify-subtext text-center">
              You&apos;re all caught up
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedChannels.map(([channelName, msgs]) => {
              const isOpen = expandedChannels.has(channelName);
              return (
                <div key={channelName} className="bg-spotify-card rounded-container border border-spotify-border overflow-hidden">
                  <button
                    onClick={() => toggleChannel(channelName)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-spotify-border/20 transition-colors"
                  >
                    <span className="text-sm font-medium text-white">
                      #{channelName}
                      <span className="text-spotify-subtext ml-2 font-normal">({msgs.length})</span>
                    </span>
                    {isOpen ? <ChevronUp size={14} className="text-spotify-subtext" /> : <ChevronDown size={14} className="text-spotify-subtext" />}
                  </button>

                  {isOpen && (
                    <div className="border-t border-spotify-border/50 p-3 space-y-2">
                      {msgs.map((msg) => (
                        <SlackMessageCard
                          key={msg.ts}
                          {...msg}
                          isSaved={isSaved("slack", msg.ts)}
                          onToggleSave={() =>
                            toggleSave({
                              sourceType: "slack",
                              sourceId: msg.ts,
                              title: msg.text.slice(0, 100),
                              content: msg.text,
                              sourceUrl: msg.deepLink,
                            })
                          }
                        />
                      ))}
                      <a
                        href={`https://slack.com/app_redirect?channel=${msgs[0].channelId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center text-xs text-spotify-green hover:underline py-2"
                      >
                        View more in Slack
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 6 — Inbox (Coming Soon) */}
      <section>
        <h2 className="text-base font-semibold text-white mb-3">
          Inbox
        </h2>
        <div className="bg-spotify-card rounded-container border border-spotify-border p-6 text-center">
          <Mail size={28} className="text-spotify-subtext mx-auto mb-3" />
          <p className="text-sm text-white font-medium mb-1">Gmail coming soon</p>
          <p className="text-xs text-spotify-subtext max-w-md mx-auto">
            Your Gmail inbox will be integrated here soon. Once connected,
            you&apos;ll see emails sent to you and to americas-csm@spotify.com
            in one place.
          </p>
        </div>
      </section>
    </div>
  );
}

function TrainingReminders({
  trainings,
  updatingId,
  onMarkDone,
}: {
  trainings: DigestTraining[];
  updatingId: string | null;
  onMarkDone: (id: string) => void;
}) {
  const incomplete = trainings.filter((t) => t.myStatus !== "completed");

  // Split into overdue and upcoming (within 7 days)
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const overdue = incomplete.filter((t) => {
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < now;
  });

  const upcomingWeek = incomplete.filter((t) => {
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due.getTime() - now.getTime()) / 86400000);
    return diff >= 0 && diff <= 7;
  });

  const displayItems = [...overdue, ...upcomingWeek];

  function dueLabel(dueDate: string) {
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.round((due.getTime() - now.getTime()) / 86400000);
    if (diff < 0) return { text: "OVERDUE", cls: "text-spotify-error font-semibold" };
    if (diff === 0) return { text: "Due today", cls: "text-spotify-warning" };
    if (diff === 1) return { text: "Due tomorrow", cls: "text-spotify-warning" };
    return {
      text: `Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      cls: "text-spotify-subtext",
    };
  }

  return (
    <section>
      <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
        <GraduationCap size={16} className="text-purple-400" />
        Training Reminders
      </h2>

      {displayItems.length === 0 ? (
        <div className="bg-spotify-card rounded-container border border-spotify-border p-6">
          <p className="text-sm text-spotify-subtext text-center">
            You&apos;re all caught up on trainings
          </p>
        </div>
      ) : (
        <div className="bg-spotify-card rounded-container border border-spotify-border divide-y divide-spotify-border/30">
          {displayItems.map((t) => {
            const dl = dueLabel(t.dueDate);
            const isOverdue = dl.text === "OVERDUE";
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-spotify-border/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-white truncate">{t.title}</p>
                    {isOverdue && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-spotify-error/15 text-spotify-error font-semibold flex-shrink-0">
                        OVERDUE
                      </span>
                    )}
                  </div>
                  <p className={`text-xs ${dl.cls}`}>
                    {isOverdue ? new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : dl.text}
                  </p>
                </div>
                <a
                  href={t.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded text-spotify-subtext hover:text-white hover:bg-spotify-border transition-colors flex-shrink-0"
                >
                  <ExternalLink size={13} />
                </a>
                <button
                  onClick={() => onMarkDone(t.id)}
                  disabled={updatingId === t.id}
                  className="text-xs px-2.5 py-1 rounded-card bg-spotify-green/15 text-spotify-green hover:bg-spotify-green/25 transition-colors flex-shrink-0 disabled:opacity-50 flex items-center gap-1"
                >
                  <Check size={11} />
                  Mark Done
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SlackPrompt() {
  return (
    <div className="bg-spotify-card rounded-container border border-spotify-border p-6 text-center">
      <MessageSquare size={24} className="text-spotify-subtext mx-auto mb-3" />
      <p className="text-sm text-white font-medium mb-1">Connect Slack</p>
      <p className="text-xs text-spotify-subtext mb-3">
        Connect your Slack account to see messages and hot topics.
      </p>
      <a
        href="/api/slack/connect"
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-spotify-green hover:bg-spotify-green/90 text-black text-sm font-semibold rounded-card transition-colors"
      >
        <MessageSquare size={14} />
        Connect Slack
      </a>
    </div>
  );
}
