"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppUser } from "@/components/user-provider";
import Link from "next/link";
import {
  ExternalLink,
  Bookmark,
  MessageSquare,
  CalendarDays,
  Flame,
  Rocket,
  Mail,
  Users,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
  GraduationCap,
  Check,
  ArrowRight,
} from "lucide-react";
import { relativeTime } from "@/lib/time";
import { useSavedItems } from "@/lib/use-saved-items";
import { HandoffNotesDashboard, HandoffAlertBanner } from "@/components/handoff-notes";

interface MyUpdate {
  text: string;
  ts: string;
  authorName: string;
  authorAvatar: string;
  channelName: string;
  deepLink: string;
  matchedKeyword: string | null;
  urgency: string;
  replyCount: number;
  reactions: { name: string; count: number }[];
}

interface TimelineItem {
  id: string;
  title: string;
  date: string;
  itemType: string;
  priority: string;
  link: string | null;
}

interface HotTopic {
  text: string;
  ts: string;
  replyCount: number;
  reactionCount: number;
  deepLink: string;
}

interface SlackMsg {
  text: string;
  ts: string;
  authorName: string;
  channelName: string;
}

interface SavedItem {
  id: string;
  title: string;
  sourceType: string;
  savedAt: string;
}

interface BookData {
  autoMatched: boolean;
  vertical: string | null;
  csManager: string | null;
  totalAccounts: number;
  roster: { level: string; team: string; region: string; cp: string } | null;
  accounts: { corporateBrand: string; cp: string }[];
}

interface TrainingItem {
  id: string;
  title: string;
  sourceUrl: string;
  dueDate: string;
  category: string;
  isRequired: boolean;
  myStatus: string;
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-spotify-error",
  high: "bg-spotify-warning",
  normal: "bg-spotify-green",
  low: "bg-spotify-subtext",
};

const URGENCY_COLORS: Record<string, string> = {
  urgent: "bg-spotify-error/15 text-spotify-error",
  high: "bg-spotify-warning/15 text-spotify-warning",
  normal: "bg-spotify-green/15 text-spotify-green",
  low: "bg-spotify-border text-spotify-subtext",
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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export default function DashboardPage() {
  const { user: appUser } = useAppUser();
  const { isSaved, toggleSave } = useSavedItems();

  const [myUpdates, setMyUpdates] = useState<MyUpdate[]>([]);
  const [updatesStatus, setUpdatesStatus] = useState<{ connected: boolean; hasBook: boolean } | null>(null);
  const [weekItems, setWeekItems] = useState<TimelineItem[]>([]);
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [hotConnected, setHotConnected] = useState(true);
  const [slackMsgs, setSlackMsgs] = useState<SlackMsg[]>([]);
  const [slackConnected, setSlackConnected] = useState(true);
  const [newItems, setNewItems] = useState<TimelineItem[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [trainings, setTrainings] = useState<TrainingItem[]>([]);
  const [book, setBook] = useState<BookData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [bookExpanded, setBookExpanded] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [qaForm, setQaForm] = useState({ title: "", date: "", itemType: "general", priority: "normal" });
  const [qaSubmitting, setQaSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [updRes, tlRes, hotRes, msgRes, savedRes, bookRes, userRes, slackStatusRes, trainRes] = await Promise.allSettled([
      fetch("/api/slack/my-updates").then((r) => r.json()),
      fetch("/api/timeline").then((r) => r.json()),
      fetch("/api/slack/hot-topics").then((r) => r.json()),
      fetch("/api/slack/messages").then((r) => r.json()),
      fetch("/api/saved?idsOnly=false").then((r) => r.json()),
      fetch("/api/book").then((r) => r.json()),
      fetch("/api/user").then((r) => r.json()),
      fetch("/api/slack/status").then((r) => r.json()),
      fetch("/api/trainings").then((r) => r.json()),
    ]);

    if (updRes.status === "fulfilled") {
      setUpdatesStatus({ connected: updRes.value.connected !== false, hasBook: updRes.value.hasBook !== false });
      setMyUpdates(updRes.value.updates ?? []);
    }

    if (tlRes.status === "fulfilled") {
      const items: TimelineItem[] = tlRes.value.items ?? [];
      const now = new Date();
      const mon = new Date(now);
      mon.setDate(mon.getDate() - mon.getDay() + (mon.getDay() === 0 ? -6 : 1));
      mon.setHours(0, 0, 0, 0);
      const fri = new Date(mon);
      fri.setDate(fri.getDate() + 4);
      fri.setHours(23, 59, 59, 999);

      setWeekItems(items.filter((i) => { const d = new Date(i.date); return d >= mon && d <= fri; }));
      setNewItems(items.filter((i) => i.itemType === "new-release" || i.itemType === "deprecation").slice(0, 2));
    }

    if (hotRes.status === "fulfilled") {
      setHotConnected(hotRes.value.connected !== false);
      setHotTopics(hotRes.value.hotTopics ?? []);
    }

    if (msgRes.status === "fulfilled") {
      setSlackConnected(msgRes.value.connected !== false);
      setSlackMsgs((msgRes.value.messages ?? []).slice(0, 3));
    }

    if (savedRes.status === "fulfilled") {
      setSavedItems((savedRes.value.items ?? []).slice(0, 2));
    }

    if (bookRes.status === "fulfilled") setBook(bookRes.value);
    if (userRes.status === "fulfilled") setIsAdmin(userRes.value.user?.isAdmin ?? false);
    if (slackStatusRes.status === "fulfilled") setNeedsReconnect(slackStatusRes.value.needsReconnect ?? false);
    if (trainRes.status === "fulfilled") setTrainings(trainRes.value.trainings ?? []);

    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const urgentCount = weekItems.filter((i) => i.priority === "urgent").length;
  const filteredUpdates = urgencyFilter === "all" ? myUpdates.slice(0, 5) : myUpdates.filter((u) => u.urgency === urgencyFilter).slice(0, 5);

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    setQaSubmitting(true);
    await fetch("/api/admin/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...qaForm, description: "", category: "announcements" }),
    });
    setQaSubmitting(false);
    setQuickAddOpen(false);
    setQaForm({ title: "", date: "", itemType: "general", priority: "normal" });
    fetchAll();
  }

  const firstName = appUser?.name?.split(" ")[0] ?? "there";
  const todayStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  if (loading) {
    return (
      <div className="max-w-5xl">
        <h1 className="text-3xl font-bold text-white mb-2">{getGreeting()}, {firstName}</h1>
        <p className="text-spotify-subtext text-sm mb-8">{todayStr}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="skeleton p-5 h-44" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">{getGreeting()}, {firstName}</h1>
        <p className="text-spotify-subtext text-sm mb-3">{todayStr}</p>
        <p className="text-xs text-spotify-subtext">
          {weekItems.length} items due this week · {slackMsgs.length} recent Slack messages · {trainings?.length ?? 0} trainings due
        </p>
        <div className="h-px bg-spotify-border/30 mt-6 mb-6" />
      </div>

      {/* Slack reconnect banner */}
      {needsReconnect && (
        <div className="bg-spotify-warning/10 border border-spotify-warning/20 rounded-card px-4 py-3 mb-4 flex items-center justify-between">
          <p className="text-sm text-spotify-warning">
            Slack permissions updated — reconnect to access private channels
          </p>
          <a
            href="/api/slack/connect"
            className="px-3 py-1.5 bg-spotify-warning text-black text-xs font-semibold rounded-card hover:bg-spotify-warning/90 transition-colors flex-shrink-0"
          >
            Reconnect
          </a>
        </div>
      )}

      {/* Handoff alert banner */}
      <HandoffAlertBanner />

      {/* CARD 1 — Updates for Your Book (full width) */}
      <div className="dash-card border border-spotify-border/50 mb-4" style={{ background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.04) 0%, transparent 60%)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Zap size={15} className="text-spotify-green" />
            Updates for Your Book
          </h2>
          <div className="flex gap-1">
            {["all", "urgent", "high", "normal", "low"].map((f) => (
              <button
                key={f}
                onClick={() => setUrgencyFilter(f)}
                className={`px-3 py-1 text-xs rounded-full border transition-all duration-200 ${
                  urgencyFilter === f
                    ? "bg-spotify-green text-black font-semibold border-spotify-green"
                    : "border-spotify-border text-spotify-subtext hover:text-white hover:border-spotify-subtext"
                }`}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {!updatesStatus?.connected ? (
          <SlackCta />
        ) : !updatesStatus?.hasBook ? (
          <Link href="/settings" className="block text-sm text-spotify-subtext hover:text-spotify-green transition-colors">
            Set up your book of business to get personalized updates &rarr;
          </Link>
        ) : filteredUpdates.length === 0 ? (
          <p className="text-sm text-spotify-subtext">
            {urgencyFilter === "all"
              ? "No updates for your book right now"
              : `No ${urgencyFilter} updates right now`}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredUpdates.map((u) => (
              <div key={u.ts} className="flex items-start gap-3 p-2.5 rounded-card bg-spotify-border/15 hover:bg-spotify-border/30 transition-colors">
                {u.authorAvatar ? (
                  <img src={u.authorAvatar} alt="" className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-spotify-border flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${URGENCY_COLORS[u.urgency]}`}>{u.urgency}</span>
                    <span className="text-xs font-medium text-white">{u.authorName}</span>
                    <span className="text-xs text-spotify-subtext">#{u.channelName}</span>
                    <span className="text-xs text-spotify-subtext ml-auto">{relativeTime(u.ts)}</span>
                  </div>
                  <p className="text-xs text-spotify-subtext line-clamp-1">{u.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {u.matchedKeyword && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-spotify-green/15 text-spotify-green">
                        {u.matchedKeyword}
                      </span>
                    )}
                    <div className="ml-auto flex gap-0.5">
                      <a href={u.deepLink} target="_blank" rel="noopener noreferrer" className="p-1 text-spotify-subtext hover:text-white transition-colors"><ExternalLink size={12} /></a>
                      <button
                        onClick={() => toggleSave({ sourceType: "slack", sourceId: u.ts, title: u.text.slice(0, 100), content: u.text, sourceUrl: u.deepLink })}
                        className={`p-1 transition-colors ${isSaved("slack", u.ts) ? "text-spotify-green" : "text-spotify-subtext hover:text-white"}`}
                      >
                        <Bookmark size={12} fill={isSaved("slack", u.ts) ? "currentColor" : "none"} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <Link href="/digest" className="footer-link block text-xs text-spotify-green hover:underline mt-3">
          View all in Daily Digest <span className="arrow-icon">&rarr;</span>
        </Link>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* CARD 2 — This Week */}
        <DashCard title="This Week" icon={<CalendarDays size={15} />} borderColor="border-l-spotify-green" footer={<Link href="/timeline" className="footer-link text-xs text-spotify-green hover:underline">View Timeline <span className="arrow-icon">&rarr;</span></Link>}>
          <div className="flex items-center gap-2 mb-3">
            {urgentCount > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-spotify-error/15 text-spotify-error">{urgentCount} urgent</span>}
            <span className="text-xs px-2 py-0.5 rounded-full bg-spotify-border text-spotify-subtext">{weekItems.length} items</span>
          </div>
          {weekItems.length === 0 ? (
            <p className="text-xs text-spotify-subtext">Clear week ahead</p>
          ) : (
            <div>
              {weekItems.slice(0, 3).map((i, idx) => (
                <div key={i.id} className={`flex items-center gap-2 py-1.5 ${idx > 0 ? "card-separator" : ""}`}>
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[i.priority]}`} />
                  <span className="text-xs text-white truncate flex-1">{i.title}</span>
                  <span className="text-xs text-spotify-subtext flex-shrink-0">{dayLabel(i.date)}</span>
                </div>
              ))}
            </div>
          )}
        </DashCard>

        {/* CARD 3 — Hot Topics */}
        <DashCard title="Hot Topics" icon={<Flame size={15} />} borderColor="border-l-orange-400" footer={<Link href="/digest" className="footer-link text-xs text-spotify-green hover:underline">View Daily Digest <span className="arrow-icon">&rarr;</span></Link>}>
          {!hotConnected ? <SlackCta small /> : hotTopics.length === 0 ? (
            <p className="text-xs text-spotify-subtext">No trending discussions</p>
          ) : (
            <div className="space-y-2">
              {hotTopics.slice(0, 2).map((t) => (
                <div key={t.ts}>
                  <p className="text-xs text-white line-clamp-2">{t.text}</p>
                  <span className="text-xs text-spotify-subtext">{t.replyCount} replies</span>
                </div>
              ))}
            </div>
          )}
        </DashCard>

        {/* CARD 4 — Slack Activity */}
        <DashCard title="Slack Activity" icon={<MessageSquare size={15} />} borderColor="border-l-purple-400" footer={<Link href="/digest" className="footer-link text-xs text-spotify-green hover:underline">Open Daily Digest <span className="arrow-icon">&rarr;</span></Link>}>
          {!slackConnected ? <SlackCta small /> : slackMsgs.length === 0 ? (
            <p className="text-xs text-spotify-subtext">No recent messages</p>
          ) : (
            <>
              <p className="text-xs text-spotify-subtext mb-2">{slackMsgs.length} recent messages</p>
              <div>
                {slackMsgs.map((m, idx) => (
                  <div key={m.ts} className={`text-xs py-1.5 ${idx > 0 ? "card-separator" : ""}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-purple-500/30 text-purple-400 flex items-center justify-center text-xs flex-shrink-0">{m.authorName[0]}</span>
                      <span className="text-white font-medium">{m.authorName}</span>
                      <span className="text-spotify-green/70"> in #{m.channelName}</span>
                    </div>
                    <p className="text-spotify-subtext line-clamp-1 mt-0.5 ml-6.5">{m.text}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </DashCard>

        {/* CARD 5 — What's New */}
        <DashCard title="What's New" icon={<Rocket size={15} />} borderColor="border-l-teal-400" footer={<Link href="/timeline" className="footer-link text-xs text-spotify-green hover:underline">View Timeline <span className="arrow-icon">&rarr;</span></Link>}>
          {newItems.length === 0 ? (
            <p className="text-xs text-spotify-subtext">No recent updates</p>
          ) : (
            <div className="space-y-2">
              {newItems.map((i) => (
                <div key={i.id}>
                  <p className="text-xs text-white font-medium">{i.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-spotify-subtext">{new Date(i.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-spotify-border text-spotify-subtext">{TYPE_LABELS[i.itemType]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashCard>

        {/* CARD 6 — Saved Items */}
        <DashCard title="Saved Items" icon={<Bookmark size={15} />} borderColor="border-l-blue-400" footer={<Link href="/saved" className="footer-link text-xs text-spotify-green hover:underline">View Saved <span className="arrow-icon">&rarr;</span></Link>}>
          {savedItems.length === 0 ? (
            <p className="text-xs text-spotify-subtext">Bookmark messages to build your library</p>
          ) : (
            <div>
              {savedItems.map((s, idx) => (
                <div key={s.id} className={`flex items-center gap-2 py-1.5 ${idx > 0 ? "card-separator" : ""}`}>
                  <span className={`text-xs px-2 py-0.5 ${s.sourceType === "slack" ? "bg-purple-500/20 text-purple-300 rounded-full" : "bg-spotify-border text-spotify-subtext rounded"}`}>{s.sourceType}</span>
                  <span className="text-xs text-white truncate">{s.title}</span>
                </div>
              ))}
            </div>
          )}
        </DashCard>

        {/* Trainings Card */}
        <TrainingsDashCard trainings={trainings} onStatusChange={fetchAll} />

        {/* Handoff Notes */}
        <HandoffNotesDashboard />

        {/* CARD 7 — Inbox */}
        <div className="opacity-50">
          <DashCard title="Inbox" icon={<Mail size={15} />} borderColor="border-l-spotify-subtext/30">
            <div className="flex items-center gap-2 mb-2">
              <Mail size={32} className="text-spotify-subtext/40" />
              <span className="text-xs px-2 py-0.5 rounded-full bg-spotify-subtext/20 text-spotify-subtext">Coming Soon</span>
            </div>
            <p className="text-xs text-spotify-subtext/60">Gmail integration coming soon</p>
          </DashCard>
        </div>

        {/* CARD 8 — My Book */}
        <DashCard title="My Book" icon={<Users size={15} />} borderColor="border-l-white/20" footer={<Link href="/settings" className="footer-link text-xs text-spotify-green hover:underline">Edit in Settings <span className="arrow-icon">&rarr;</span></Link>}>
          {!book || book.totalAccounts === 0 ? (
            <Link href="/settings" className="block">
              <div className="bg-spotify-border/20 rounded-card p-3 flex items-center gap-2">
                <span className="text-xs text-spotify-subtext hover:text-spotify-green transition-colors">Set up your book</span>
                <ArrowRight size={14} className="text-spotify-green" />
              </div>
            </Link>
          ) : (
            <>
              <p className="text-xs text-white mb-1">
                {book.totalAccounts} accounts in {book.vertical}
              </p>
              {book.csManager && <p className="text-xs text-spotify-subtext">Manager: {book.csManager}</p>}
              <button
                onClick={() => setBookExpanded(!bookExpanded)}
                className="text-xs text-spotify-green hover:underline mt-2 flex items-center gap-0.5"
              >
                {bookExpanded ? <>Hide <ChevronUp size={10} /></> : <>Show accounts <ChevronDown size={10} /></>}
              </button>
              {bookExpanded && (
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {(book.accounts ?? []).map((a) => (
                    <div key={a.corporateBrand} className="flex items-center justify-between text-xs">
                      <span className="text-white truncate">{a.corporateBrand}</span>
                      <span className="text-spotify-subtext flex-shrink-0 ml-2">{a.cp}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </DashCard>
      </div>

      {/* Admin quick-add FAB */}
      {isAdmin && (
        <>
          <button
            onClick={() => setQuickAddOpen(true)}
            className="fixed bottom-6 right-6 w-12 h-12 bg-spotify-green hover:bg-spotify-green/90 rounded-full flex items-center justify-center shadow-lg shadow-spotify-green/20 hover:translate-y-[-2px] transition-all z-50"
          >
            <Plus size={22} className="text-black" />
          </button>

          {quickAddOpen && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <form
                onSubmit={handleQuickAdd}
                className="bg-spotify-card border border-spotify-border rounded-container p-6 w-full max-w-md space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">Quick Add</h3>
                  <button type="button" onClick={() => setQuickAddOpen(false)} className="text-spotify-subtext hover:text-white">
                    <X size={18} />
                  </button>
                </div>
                <input
                  required
                  placeholder="Title"
                  value={qaForm.title}
                  onChange={(e) => setQaForm({ ...qaForm, title: e.target.value })}
                  className="w-full bg-spotify-border/50 text-sm text-white rounded-card px-3 py-2 border border-spotify-border focus:border-spotify-green focus:outline-none"
                />
                <input
                  required
                  type="date"
                  value={qaForm.date}
                  onChange={(e) => setQaForm({ ...qaForm, date: e.target.value })}
                  className="w-full bg-spotify-border/50 text-sm text-white rounded-card px-3 py-2 border border-spotify-border focus:border-spotify-green focus:outline-none [color-scheme:dark]"
                />
                <select
                  value={qaForm.itemType}
                  onChange={(e) => setQaForm({ ...qaForm, itemType: e.target.value })}
                  className="w-full bg-spotify-border/50 text-sm text-white rounded-card px-3 py-2 border border-spotify-border focus:border-spotify-green focus:outline-none"
                >
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <div className="flex gap-3">
                  {[
                    { v: "urgent", d: "bg-spotify-error" },
                    { v: "high", d: "bg-spotify-warning" },
                    { v: "normal", d: "bg-spotify-green" },
                    { v: "low", d: "bg-spotify-subtext" },
                  ].map((p) => (
                    <label key={p.v} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="qaPriority" value={p.v} checked={qaForm.priority === p.v} onChange={() => setQaForm({ ...qaForm, priority: p.v })} className="sr-only" />
                      <span className={`w-3 h-3 rounded-full ${p.d} ${qaForm.priority === p.v ? "ring-2 ring-white ring-offset-2 ring-offset-spotify-card" : "opacity-40"}`} />
                      <span className={`text-xs ${qaForm.priority === p.v ? "text-white" : "text-spotify-subtext"}`}>{p.v}</span>
                    </label>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={qaSubmitting}
                  className="w-full py-2.5 bg-spotify-green hover:bg-spotify-green/90 text-black font-semibold text-sm rounded-card transition-colors disabled:opacity-50"
                >
                  {qaSubmitting ? "Publishing..." : "Publish"}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const GLOW_MAP: Record<string, string> = {
  "border-l-spotify-green": "card-glow-green",
  "border-l-orange-400": "card-glow-orange",
  "border-l-purple-400": "card-glow-purple",
  "border-l-blue-400": "card-glow-blue",
  "border-l-teal-400": "card-glow-teal",
  "border-l-purple-500": "card-glow-purple",
  "border-l-yellow-400": "card-glow-yellow",
  "border-l-red-400": "card-glow-red",
};

function DashCard({
  title,
  icon,
  borderColor,
  footer,
  dimmed,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  borderColor: string;
  footer?: React.ReactNode;
  dimmed?: boolean;
  children: React.ReactNode;
}) {
  const glowClass = GLOW_MAP[borderColor] ?? "";
  return (
    <div
      className={`dash-card border border-spotify-border/50 border-l-4 ${borderColor} ${glowClass} flex flex-col ${dimmed ? "opacity-50" : ""}`}
    >
      <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
        {icon}
        {title}
      </h3>
      <div className="flex-1">{children}</div>
      {footer && <div className="mt-3 pt-3 card-separator">{footer}</div>}
    </div>
  );
}

function TrainingsDashCard({ trainings, onStatusChange }: { trainings: TrainingItem[]; onStatusChange: () => void }) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const incomplete = trainings.filter((t) => t.myStatus !== "completed");
  const overdue = incomplete.filter((t) => {
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return due < now;
  });
  const upcoming = incomplete
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  const total = trainings.length;
  const completed = trainings.filter((t) => t.myStatus === "completed").length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  async function markDone(id: string) {
    setUpdatingId(id);
    await fetch(`/api/trainings/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    setUpdatingId(null);
    onStatusChange();
  }

  const STATUS_DOT: Record<string, string> = {
    "not-started": "bg-spotify-error",
    "in-progress": "bg-spotify-warning",
    completed: "bg-spotify-green",
  };

  function dueLabel(d: string) {
    const due = new Date(d);
    due.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.round((due.getTime() - now.getTime()) / 86400000);
    if (diff < 0) return { text: "OVERDUE", cls: "text-spotify-error font-semibold" };
    if (diff === 0) return { text: "Today", cls: "text-spotify-warning" };
    if (diff === 1) return { text: "Tomorrow", cls: "text-spotify-warning" };
    return { text: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }), cls: "text-spotify-subtext" };
  }

  return (
    <DashCard
      title="Trainings"
      icon={<GraduationCap size={15} />}
      borderColor="border-l-purple-500"
      footer={<Link href="/timeline" className="footer-link text-xs text-spotify-green hover:underline">View all in Timeline <span className="arrow-icon">&rarr;</span></Link>}
    >
      {upcoming.length === 0 ? (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-spotify-subtext">{incomplete.length} incomplete</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span>&#x2705;</span>
            <span className="text-sm text-spotify-green">All caught up!</span>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3">
            {overdue.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-spotify-error/15 text-spotify-error font-medium">
                {overdue.length} overdue
              </span>
            )}
            <span className="text-xs text-spotify-subtext">{incomplete.length} incomplete</span>
          </div>
          <div>
            {upcoming.map((t, idx) => {
              const dl = dueLabel(t.dueDate);
              return (
                <div key={t.id} className={`flex items-center gap-2 py-1.5 ${idx > 0 ? "card-separator" : ""}`}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[t.myStatus] ?? "bg-spotify-subtext"}`} />
                  <span className="text-xs text-white truncate flex-1">{t.title}</span>
                  <span className={`text-xs flex-shrink-0 ${dl.cls}`}>{dl.text}</span>
                  {t.myStatus !== "completed" && (
                    <button
                      onClick={() => markDone(t.id)}
                      disabled={updatingId === t.id}
                      className="p-0.5 rounded text-spotify-subtext hover:text-spotify-green transition-colors disabled:opacity-50 flex-shrink-0"
                      title="Mark Done"
                    >
                      <Check size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {/* Progress bar */}
          <div className="mt-3">
            <div className="h-1.5 rounded-full bg-spotify-border overflow-hidden">
              <div
                className="h-full rounded-full bg-spotify-green"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-spotify-subtext mt-1">{completed}/{total} completed</p>
          </div>
        </>
      )}
    </DashCard>
  );
}

function SlackCta({ small }: { small?: boolean }) {
  return (
    <div className={small ? "" : "py-2"}>
      <a
        href="/api/slack/connect"
        className="text-xs text-spotify-green hover:underline flex items-center gap-1"
      >
        <MessageSquare size={12} /> Connect Slack
      </a>
    </div>
  );
}
