"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  ExternalLink,
  Bookmark,
  Plus,
  Rocket,
  AlertTriangle,
  BookOpen,
  Check,
} from "lucide-react";
import Link from "next/link";

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate: string | null;
  itemType: string;
  category: string;
  priority: string;
  link: string | null;
  isRecurring: boolean;
  recurrencePattern: string | null;
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

const TYPE_LABELS: Record<string, string> = {
  "new-release": "New Release",
  deprecation: "Deprecation",
  deadline: "Deadline",
  training: "Training",
  survey: "Survey",
  "all-hands": "All-Hands",
  general: "General",
};

const CATEGORY_COLORS: Record<string, { dot: string; bg: string; label: string }> = {
  surveys: { dot: "bg-purple-400", bg: "bg-purple-400/10", label: "Surveys & Feedback" },
  meetings: { dot: "bg-blue-400", bg: "bg-blue-400/10", label: "Meetings & Trainings" },
  programs: { dot: "bg-teal-400", bg: "bg-teal-400/10", label: "Programs" },
  campaigns: { dot: "bg-orange-400", bg: "bg-orange-400/10", label: "Campaigns" },
  announcements: { dot: "bg-gray-400", bg: "bg-gray-400/10", label: "Announcements" },
  trainings: { dot: "bg-purple-500", bg: "bg-purple-500/10", label: "Trainings" },
};

const STATUS_DOT: Record<string, string> = {
  "not-started": "bg-spotify-error",
  "in-progress": "bg-spotify-warning",
  completed: "bg-spotify-green",
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-spotify-error",
  high: "bg-spotify-warning",
  normal: "bg-spotify-green",
  low: "bg-spotify-subtext",
};

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getMonday(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function formatDateRange(mon: Date) {
  const fri = new Date(mon);
  fri.setDate(fri.getDate() + 4);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${mon.toLocaleDateString("en-US", opts)} – ${fri.toLocaleDateString("en-US", opts)}`;
}

function daysUntil(dateStr: string) {
  const target = startOfDay(new Date(dateStr));
  const today = startOfDay(new Date());
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function TimelinePage() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [trainings, setTrainings] = useState<TrainingItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const [updatingTrainingId, setUpdatingTrainingId] = useState<string | null>(null);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const todayRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  const scrollToToday = useCallback(() => {
    if (!todayRef.current) return;
    const y = todayRef.current.getBoundingClientRect().top + window.scrollY - 20;
    window.scrollTo({ top: y, behavior: "smooth" });
  }, []);

  // Auto-scroll to today on first load
  useEffect(() => {
    if (!loading && !hasScrolled.current && todayRef.current) {
      hasScrolled.current = true;
      setTimeout(() => {
        const y = todayRef.current!.getBoundingClientRect().top + window.scrollY - 20;
        window.scrollTo({ top: y, behavior: "smooth" });
      }, 300);
    }
  }, [loading]);

  // Track whether today marker is in view
  useEffect(() => {
    if (!todayRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowJumpButton(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(todayRef.current);
    return () => observer.disconnect();
  }, [loading]);

  function fetchData() {
    setLoading(true);
    Promise.allSettled([
      fetch("/api/timeline").then((r) => r.json()),
      fetch("/api/trainings").then((r) => r.json()),
    ]).then(([tlRes, trRes]) => {
      if (tlRes.status === "fulfilled") {
        setItems(tlRes.value.items);
        setIsAdmin(tlRes.value.isAdmin);
      }
      if (trRes.status === "fulfilled") {
        setTrainings(trRes.value.trainings ?? []);
      }
      setLoading(false);
    });
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function markTrainingDone(id: string) {
    setUpdatingTrainingId(id);
    await fetch(`/api/trainings/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    setUpdatingTrainingId(null);
    fetchData();
  }

  const today = useMemo(() => startOfDay(new Date()), []);
  const monday = useMemo(() => getMonday(today), [today]);
  const friday = useMemo(() => {
    const f = new Date(monday);
    f.setDate(f.getDate() + 4);
    return f;
  }, [monday]);

  const thisWeekItems = useMemo(
    () =>
      items
        .filter((item) => {
          const d = startOfDay(new Date(item.date));
          return d >= monday && d <= friday;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [items, monday, friday]
  );

  const trainingsThisWeek = useMemo(
    () =>
      trainings.filter((t) => {
        const d = startOfDay(new Date(t.dueDate));
        return d >= monday && d <= friday;
      }),
    [trainings, monday, friday]
  );

  const trainingsDueSoon = useMemo(
    () =>
      trainings
        .filter((t) => t.myStatus !== "completed" && daysUntil(t.dueDate) >= -7 && daysUntil(t.dueDate) <= 30)
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [trainings]
  );

  const urgentCount = thisWeekItems.filter((i) => i.priority === "urgent").length;

  const newReleases = useMemo(
    () =>
      items
        .filter((i) => i.itemType === "new-release" && daysUntil(i.date) >= -7)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [items]
  );

  const deprecations = useMemo(
    () =>
      items
        .filter((i) => i.itemType === "deprecation" && daysUntil(i.date) >= -7)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [items]
  );

  // Convert trainings to timeline-compatible items
  const trainingTimelineItems = useMemo(
    () =>
      trainings.map((t): TimelineItem => ({
        id: `training-${t.id}`,
        title: t.title,
        description: "",
        date: t.dueDate,
        endDate: null,
        itemType: "training",
        category: "trainings",
        priority: "normal",
        link: t.sourceUrl,
        isRecurring: false,
        recurrencePattern: null,
      })),
    [trainings]
  );

  const allItems = useMemo(
    () => [...items, ...trainingTimelineItems],
    [items, trainingTimelineItems]
  );

  const filteredItems = useMemo(() => {
    if (activeCategories.size === 0) return allItems;
    return allItems.filter((i) => activeCategories.has(i.category));
  }, [allItems, activeCategories]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, TimelineItem[]> = {};
    for (const item of filteredItems) {
      const key = startOfDay(new Date(item.date)).toISOString();
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return Object.entries(groups).sort(
      ([a], [b]) => new Date(a).getTime() - new Date(b).getTime()
    );
  }, [filteredItems]);

  function toggleCategory(cat: string) {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="max-w-5xl">
        <h1 className="text-2xl font-bold text-white mb-2">Timeline</h1>
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-white mb-2">Timeline</h1>
      <p className="text-spotify-subtext mb-8">
        Upcoming dates, deadlines, and events at a glance.
      </p>

      {/* SECTION 1 — This Week */}
      <button
        onClick={scrollToToday}
        className="w-full text-left mb-8"
      >
        <div className="bg-spotify-card rounded-container border border-spotify-border p-5 border-l-4 border-l-spotify-green hover:bg-spotify-border/20 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-white">This Week</h2>
              <p className="text-xs text-spotify-subtext">{formatDateRange(monday)}</p>
            </div>
            <div className="flex items-center gap-3">
              {urgentCount > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-spotify-error/15 text-spotify-error font-medium">
                  {urgentCount} urgent
                </span>
              )}
              <span className="text-xs text-spotify-subtext">
                {thisWeekItems.length + trainingsThisWeek.length} items this week
              </span>
            </div>
          </div>

          {thisWeekItems.length === 0 && trainingsThisWeek.length === 0 ? (
            <p className="text-sm text-spotify-subtext">Clear week ahead</p>
          ) : (
            <div className="space-y-1.5">
              {thisWeekItems.map((item) => {
                const days = daysUntil(item.date);
                const isToday = days === 0;
                const isTomorrow = days === 1;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-card transition-colors ${
                      isToday
                        ? "bg-spotify-error/10"
                        : isTomorrow
                        ? "bg-spotify-warning/10"
                        : "bg-spotify-border/20"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[item.priority] ?? "bg-spotify-subtext"}`} />
                    <span className="text-sm text-white flex-1 truncate">{item.title}</span>
                    <span className="text-xs text-spotify-subtext flex-shrink-0">
                      {isToday ? "Today" : isTomorrow ? "Tomorrow" : formatDate(item.date)}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-spotify-border text-spotify-subtext flex-shrink-0">
                      {TYPE_LABELS[item.itemType] ?? item.itemType}
                    </span>
                    {item.link && (
                      <ExternalLink size={12} className="text-spotify-subtext flex-shrink-0" />
                    )}
                  </div>
                );
              })}
              {trainingsThisWeek.map((t) => {
                const days = daysUntil(t.dueDate);
                const isToday = days === 0;
                const isTomorrow = days === 1;
                return (
                  <div
                    key={`training-${t.id}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-card transition-colors ${
                      isToday ? "bg-spotify-error/10" : isTomorrow ? "bg-spotify-warning/10" : "bg-purple-500/10"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[t.myStatus] ?? "bg-spotify-subtext"}`} />
                    <span className="text-sm text-white flex-1 truncate">{t.title}</span>
                    <span className="text-xs text-spotify-subtext flex-shrink-0">
                      {isToday ? "Today" : isTomorrow ? "Tomorrow" : formatDate(t.dueDate)}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 flex-shrink-0">
                      Training
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </button>

      {/* SECTION 2 — New & Changing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
        {/* New Releases */}
        <div className="bg-spotify-card rounded-container border border-spotify-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Rocket size={16} className="text-spotify-green" />
              New Releases
            </h2>
            {isAdmin && (
              <Link
                href="/admin"
                className="text-xs text-spotify-subtext hover:text-spotify-green flex items-center gap-1 transition-colors"
              >
                <Plus size={12} /> Add
              </Link>
            )}
          </div>

          {newReleases.length === 0 ? (
            <p className="text-sm text-spotify-subtext">No new releases.</p>
          ) : (
            <div className="space-y-3">
              {newReleases.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-spotify-green mt-2 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="text-xs text-spotify-subtext mb-1">{formatDate(item.date)}</p>
                    <p className="text-xs text-spotify-subtext line-clamp-2">{item.description}</p>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-spotify-green hover:underline mt-1 inline-flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Learn more <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deprecations */}
        <div className="bg-spotify-card rounded-container border border-spotify-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <AlertTriangle size={16} className="text-spotify-warning" />
              Deprecations
            </h2>
            {isAdmin && (
              <Link
                href="/admin"
                className="text-xs text-spotify-subtext hover:text-spotify-green flex items-center gap-1 transition-colors"
              >
                <Plus size={12} /> Add
              </Link>
            )}
          </div>

          {deprecations.length === 0 ? (
            <p className="text-sm text-spotify-subtext">No deprecations.</p>
          ) : (
            <div className="space-y-3">
              {deprecations.map((item) => {
                const days = daysUntil(item.date);
                const urgency =
                  days <= 7
                    ? "text-spotify-error"
                    : days <= 30
                    ? "text-spotify-warning"
                    : "text-spotify-subtext";
                const dotColor =
                  days <= 7
                    ? "bg-spotify-error"
                    : days <= 30
                    ? "bg-spotify-warning"
                    : "bg-orange-400";
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${dotColor}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{item.title}</p>
                      <p className={`text-xs font-medium ${urgency} mb-1`}>
                        {days <= 0
                          ? "Sunset"
                          : `Sunsetting in ${days} day${days === 1 ? "" : "s"}`}
                      </p>
                      <p className="text-xs text-spotify-subtext line-clamp-2">{item.description}</p>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-spotify-green hover:underline mt-1 inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Learn more <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Trainings Due Soon */}
        <div className="bg-spotify-card rounded-container border border-spotify-border p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <BookOpen size={16} className="text-purple-400" />
              Trainings Due Soon
            </h2>
          </div>

          {trainingsDueSoon.length === 0 ? (
            <p className="text-sm text-spotify-subtext">All caught up on trainings!</p>
          ) : (
            <div className="space-y-2">
              {trainingsDueSoon.map((t) => {
                const days = daysUntil(t.dueDate);
                const urgency =
                  days < 0
                    ? "text-spotify-error"
                    : days <= 3
                    ? "text-spotify-warning"
                    : "text-spotify-subtext";
                return (
                  <div key={t.id} className="flex items-center gap-3 p-2 rounded-card bg-spotify-border/15 hover:bg-spotify-border/30 transition-colors">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_DOT[t.myStatus] ?? "bg-spotify-subtext"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{t.title}</p>
                      <p className={`text-xs ${urgency}`}>
                        {days < 0 ? "OVERDUE" : days === 0 ? "Due today" : `Due in ${days} day${days === 1 ? "" : "s"}`}
                      </p>
                    </div>
                    <a
                      href={t.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded text-spotify-subtext hover:text-white hover:bg-spotify-border transition-colors flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={13} />
                    </a>
                    {t.myStatus !== "completed" && (
                      <button
                        onClick={() => markTrainingDone(t.id)}
                        disabled={updatingTrainingId === t.id}
                        className="text-xs px-2.5 py-1 rounded-card bg-spotify-green/15 text-spotify-green hover:bg-spotify-green/25 transition-colors flex-shrink-0 disabled:opacity-50 flex items-center gap-1"
                      >
                        <Check size={11} />
                        Mark Done
                      </button>
                    )}
                    {t.myStatus === "completed" && (
                      <span className="text-xs px-2.5 py-1 rounded-card bg-spotify-green/15 text-spotify-green flex-shrink-0 flex items-center gap-1">
                        <Check size={11} />
                        Done
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3 — Full Timeline */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Full Timeline</h2>

        {/* Category filters */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveCategories(new Set())}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              activeCategories.size === 0
                ? "bg-spotify-green text-black font-medium"
                : "bg-spotify-card border border-spotify-border text-spotify-subtext hover:text-white"
            }`}
          >
            All
          </button>
          {Object.entries(CATEGORY_COLORS).map(([key, val]) => (
            <button
              key={key}
              onClick={() => toggleCategory(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors ${
                activeCategories.has(key)
                  ? `${val.bg} text-white font-medium border border-transparent`
                  : "bg-spotify-card border border-spotify-border text-spotify-subtext hover:text-white"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${val.dot}`} />
              {val.label}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative pl-8 border-l-2 border-spotify-border/50 space-y-0">
          {/* Always render a Today marker even if no items today */}
          {!groupedByDate.some(([k]) => startOfDay(new Date(k)).getTime() === today.getTime()) && (
            <div ref={todayRef} className="mt-4">
              <div className="flex items-center gap-2 -ml-[calc(2rem+1px)] mb-2">
                <div className="w-3 h-3 rounded-full bg-spotify-green border-2 border-spotify-darkgray" />
                <div className="h-px flex-1 bg-spotify-green/40" />
                <span className="text-xs font-medium text-spotify-green px-2">Today</span>
                <div className="h-px flex-1 bg-spotify-green/40" />
              </div>
              <p className="text-xs text-spotify-subtext ml-2 mb-4">No items scheduled for today</p>
            </div>
          )}

          {groupedByDate.map(([dateKey, dateItems]) => {
            const date = new Date(dateKey);
            const isToday = startOfDay(date).getTime() === today.getTime();
            const isPast = date < today;

            return (
              <div
                key={dateKey}
                ref={isToday ? todayRef : undefined}
                className={isPast && !isToday ? "opacity-40" : ""}
              >
                {/* Today marker */}
                {isToday && (
                  <div className="flex items-center gap-2 -ml-[calc(2rem+1px)] mb-2">
                    <div className="w-3 h-3 rounded-full bg-spotify-green border-2 border-spotify-darkgray" />
                    <div className="h-px flex-1 bg-spotify-green/40" />
                    <span className="text-xs font-medium text-spotify-green px-2">Today</span>
                    <div className="h-px flex-1 bg-spotify-green/40" />
                  </div>
                )}

                {/* Date header */}
                <div className="flex items-center gap-2 -ml-[calc(2rem+1px)] mb-2 mt-4">
                  <div className={`w-2.5 h-2.5 rounded-full border-2 border-spotify-darkgray ${isToday ? "bg-spotify-green" : "bg-spotify-border"}`} />
                  <span className={`text-xs font-medium ${isToday ? "text-white" : "text-spotify-subtext"}`}>
                    {formatDate(dateKey)}
                  </span>
                </div>

                {/* Items for this date */}
                <div className="space-y-2 mb-2 ml-2">
                  {dateItems.map((item) => {
                    const catColor = CATEGORY_COLORS[item.category];
                    return (
                      <div
                        key={item.id}
                        className="bg-spotify-card rounded-card border border-spotify-border p-3 hover:bg-spotify-border/20 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${catColor?.dot ?? "bg-gray-400"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-medium text-white truncate">{item.title}</p>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-spotify-border text-spotify-subtext flex-shrink-0">
                                {TYPE_LABELS[item.itemType] ?? item.itemType}
                              </span>
                            </div>
                            <p className="text-xs text-spotify-subtext line-clamp-1">{item.description}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {item.link && (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded text-spotify-subtext hover:text-white hover:bg-spotify-border transition-colors"
                              >
                                <ExternalLink size={13} />
                              </a>
                            )}
                            <button className="p-1 rounded text-spotify-subtext hover:text-white hover:bg-spotify-border transition-colors">
                              <Bookmark size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Jump to Today button */}
      {showJumpButton && (
        <button
          onClick={scrollToToday}
          className="fixed bottom-6 right-6 px-4 py-2 bg-spotify-green text-black text-sm font-semibold rounded-full shadow-lg shadow-spotify-green/20 hover:bg-spotify-green/90 transition-all duration-200 hover:translate-y-[-1px] z-50"
        >
          Jump to Today
        </button>
      )}
    </div>
  );
}
