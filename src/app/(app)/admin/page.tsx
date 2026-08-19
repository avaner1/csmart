"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeEditor } from "@/components/theme-editor";
import {
  Trash2,
  Pencil,
  Plus,
  RefreshCw,
  List,
  Paintbrush,
  UserPlus,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Link2,
} from "lucide-react";

interface AdminItem {
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
  createdBy?: { name: string };
}

interface TrainingItem {
  id: string;
  title: string;
  description: string;
  sourceUrl: string;
  dueDate: string;
  assignedTo: string;
  category: string;
  isRequired: boolean;
  completionStats: { total: number; completed: number };
}

interface TrainingStat {
  id: string;
  title: string;
  dueDate: string;
  category: string;
  assignedTo: string;
  totalAssigned: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  incompleteUsers: { name: string; email: string; team: string }[];
}

interface RosterEntry {
  region: string;
  team: string;
  email: string;
  csmName: string;
}

interface QuickLinkItem {
  id: string;
  title: string;
  url: string;
  description: string;
}

const TYPES = [
  "new-release",
  "deprecation",
  "deadline",
  "training",
  "survey",
  "all-hands",
  "general",
];

const CATEGORIES = [
  "surveys",
  "meetings",
  "programs",
  "campaigns",
  "announcements",
];

const CATEGORY_LABELS: Record<string, string> = {
  surveys: "Surveys & Feedback",
  meetings: "Meetings & Trainings",
  programs: "Programs",
  campaigns: "Campaigns",
  announcements: "Announcements",
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

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent", dot: "bg-spotify-error" },
  { value: "high", label: "High", dot: "bg-spotify-warning" },
  { value: "normal", label: "Normal", dot: "bg-spotify-green" },
  { value: "low", label: "Low", dot: "bg-spotify-subtext" },
];

const RECURRENCE = ["weekly", "biweekly", "monthly", "quarterly"];

const TRAINING_CATEGORIES = [
  { value: "certification", label: "Certification" },
  { value: "product-training", label: "Product Training" },
  { value: "onboarding", label: "Onboarding" },
  { value: "compliance", label: "Compliance" },
  { value: "skill-development", label: "Skill Development" },
];

const TRAINING_CAT_COLORS: Record<string, { bg: string; text: string }> = {
  certification: { bg: "bg-purple-400/15", text: "text-purple-400" },
  "product-training": { bg: "bg-blue-400/15", text: "text-blue-400" },
  onboarding: { bg: "bg-green-400/15", text: "text-green-400" },
  compliance: { bg: "bg-red-400/15", text: "text-red-400" },
  "skill-development": { bg: "bg-teal-400/15", text: "text-teal-400" },
};

function priorityDot(p: string) {
  const opt = PRIORITY_OPTIONS.find((o) => o.value === p);
  return opt?.dot ?? "bg-spotify-subtext";
}

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"all" | "add" | "recurring" | "appearance" | "trainings">("all");
  const [items, setItems] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    endDate: "",
    itemType: "general",
    category: "announcements",
    priority: "normal",
    link: "",
    isRecurring: false,
    recurrencePattern: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Grant admin
  const [grantEmail, setGrantEmail] = useState("");
  const [grantMsg, setGrantMsg] = useState("");

  // Training state
  const [trainings, setTrainings] = useState<TrainingItem[]>([]);
  const [trainingStats, setTrainingStats] = useState<TrainingStat[]>([]);
  const [trainingsLoading, setTrainingsLoading] = useState(false);
  const [trainingSubTab, setTrainingSubTab] = useState<"list" | "add" | "stats">("list");
  const [editingTrainingId, setEditingTrainingId] = useState<string | null>(null);
  const [expandedStat, setExpandedStat] = useState<string | null>(null);
  const [rosterData, setRosterData] = useState<RosterEntry[]>([]);
  const [assignSearch, setAssignSearch] = useState("");

  // Training form
  const [tForm, setTForm] = useState({
    title: "",
    description: "",
    dueDate: "",
    sourceUrl: "",
    assignedTo: "all",
    category: "product-training",
    isRequired: true,
  });
  const [tSubmitting, setTSubmitting] = useState(false);

  // Quick Links state
  const [quickLinks, setQuickLinks] = useState<QuickLinkItem[]>([]);
  const [qlForm, setQlForm] = useState({ title: "", url: "", description: "" });
  const [qlSubmitting, setQlSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user?.isAdmin) {
          router.replace("/dashboard");
        } else {
          setIsAdmin(true);
        }
      });
  }, [router]);

  async function fetchItems() {
    setLoading(true);
    const filter = tab === "recurring" ? "?filter=recurring" : "";
    const res = await fetch(`/api/admin/items${filter}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
    }
    setLoading(false);
  }

  async function fetchTrainings() {
    setTrainingsLoading(true);
    const [tRes, sRes, rRes, qlRes] = await Promise.allSettled([
      fetch("/api/trainings").then((r) => r.json()),
      fetch("/api/trainings/stats").then((r) => r.json()),
      fetch("/api/directory").then((r) => r.json()),
      fetch("/api/quick-links").then((r) => r.json()),
    ]);
    if (tRes.status === "fulfilled") setTrainings(tRes.value.trainings ?? []);
    if (sRes.status === "fulfilled") setTrainingStats(sRes.value.stats ?? []);
    if (rRes.status === "fulfilled") {
      const roster: RosterEntry[] = (rRes.value.roster ?? []).map((r: Record<string, string>) => ({
        region: r.region,
        team: r.team,
        email: r.email,
        csmName: r.csmName,
      }));
      setRosterData(roster);
    }
    if (qlRes.status === "fulfilled") setQuickLinks(qlRes.value.links ?? []);
    setTrainingsLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isAdmin) return;
    if (tab === "trainings") {
      fetchTrainings();
    } else {
      fetchItems();
    }
  }, [isAdmin, tab]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const url = editingId
      ? `/api/admin/items/${editingId}`
      : "/api/admin/items";
    const method = editingId ? "PATCH" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        endDate: form.endDate || null,
        recurrencePattern: form.isRecurring ? form.recurrencePattern : null,
      }),
    });

    setForm({
      title: "",
      description: "",
      date: "",
      endDate: "",
      itemType: "general",
      category: "announcements",
      priority: "normal",
      link: "",
      isRecurring: false,
      recurrencePattern: "",
    });
    setEditingId(null);
    setSubmitting(false);
    setTab("all");
    fetchItems();
  }

  function startEdit(item: AdminItem) {
    setForm({
      title: item.title,
      description: item.description,
      date: item.date.slice(0, 10),
      endDate: item.endDate?.slice(0, 10) ?? "",
      itemType: item.itemType,
      category: item.category,
      priority: item.priority,
      link: item.link ?? "",
      isRecurring: item.isRecurring,
      recurrencePattern: item.recurrencePattern ?? "",
    });
    setEditingId(item.id);
    setTab("add");
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/items/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleGrantAdmin(e: React.FormEvent) {
    e.preventDefault();
    setGrantMsg("");
    const res = await fetch("/api/admin/make-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: grantEmail }),
    });
    const data = await res.json();
    if (res.ok) {
      setGrantMsg(`${data.name} is now an admin.`);
      setGrantEmail("");
    } else {
      setGrantMsg(data.error);
    }
  }

  // Training handlers
  async function handleTrainingSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTSubmitting(true);

    const url = editingTrainingId
      ? `/api/trainings/${editingTrainingId}`
      : "/api/trainings";
    const method = editingTrainingId ? "PATCH" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tForm),
    });

    setTForm({
      title: "",
      description: "",
      dueDate: "",
      sourceUrl: "",
      assignedTo: "all",
      category: "product-training",
      isRequired: true,
    });
    setEditingTrainingId(null);
    setTSubmitting(false);
    setTrainingSubTab("list");
    fetchTrainings();
  }

  function startEditTraining(t: TrainingItem) {
    setTForm({
      title: t.title,
      description: t.description,
      dueDate: t.dueDate.slice(0, 10),
      sourceUrl: t.sourceUrl,
      assignedTo: t.assignedTo,
      category: t.category,
      isRequired: t.isRequired,
    });
    setEditingTrainingId(t.id);
    setTrainingSubTab("add");
  }

  async function handleDeleteTraining(id: string) {
    await fetch(`/api/trainings/${id}`, { method: "DELETE" });
    setTrainings((prev) => prev.filter((t) => t.id !== id));
    setTrainingStats((prev) => prev.filter((s) => s.id !== id));
  }

  async function handleQuickLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setQlSubmitting(true);
    await fetch("/api/quick-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(qlForm),
    });
    setQlForm({ title: "", url: "", description: "" });
    setQlSubmitting(false);
    fetchTrainings();
  }

  async function handleDeleteQuickLink(id: string) {
    await fetch(`/api/quick-links?id=${id}`, { method: "DELETE" });
    setQuickLinks((prev) => prev.filter((l) => l.id !== id));
  }

  if (isAdmin === null) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Build assign dropdown options from roster
  const regions = Array.from(new Set(rosterData.map((r) => r.region))).filter(Boolean).sort();
  const teams = Array.from(new Set(rosterData.map((r) => r.team))).filter(Boolean).sort();
  const filteredPeople = assignSearch.length >= 2
    ? rosterData.filter(
        (r) =>
          r.csmName.toLowerCase().includes(assignSearch.toLowerCase()) ||
          r.email.toLowerCase().includes(assignSearch.toLowerCase())
      ).slice(0, 5)
    : [];

  // Stats summary
  const overallCompleted = trainingStats.reduce((s, t) => s + t.completedCount, 0);
  const overallTotal = trainingStats.reduce((s, t) => s + t.totalAssigned, 0);
  const overallRate = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

  const tabs = [
    { key: "all" as const, label: "All Items", icon: List },
    { key: "add" as const, label: editingId ? "Edit Item" : "Add New", icon: Plus },
    { key: "recurring" as const, label: "Recurring Items", icon: RefreshCw },
    { key: "trainings" as const, label: "Trainings", icon: GraduationCap },
    { key: "appearance" as const, label: "Appearance", icon: Paintbrush },
  ];

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-6">Admin</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-spotify-card rounded-card p-1 w-fit flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); if (t.key !== "add") setEditingId(null); }}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-card transition-colors ${
              tab === t.key
                ? "bg-spotify-border text-white"
                : "text-spotify-subtext hover:text-white"
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Add/Edit Form */}
      {tab === "add" && (
        <form onSubmit={handleSubmit} className="bg-spotify-card rounded-container border border-spotify-border p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-spotify-subtext mb-1">Title *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-spotify-border/50 text-sm text-white rounded-card px-3 py-2 border border-spotify-border focus:border-spotify-green focus:outline-none"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs text-spotify-subtext mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full bg-spotify-border/50 text-sm text-white rounded-card px-3 py-2 border border-spotify-border focus:border-spotify-green focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs text-spotify-subtext mb-1">Date *</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full bg-spotify-border/50 text-sm text-white rounded-card px-3 py-2 border border-spotify-border focus:border-spotify-green focus:outline-none [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-xs text-spotify-subtext mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full bg-spotify-border/50 text-sm text-white rounded-card px-3 py-2 border border-spotify-border focus:border-spotify-green focus:outline-none [color-scheme:dark]"
              />
            </div>

            <div>
              <label className="block text-xs text-spotify-subtext mb-1">Type</label>
              <select
                value={form.itemType}
                onChange={(e) => setForm({ ...form, itemType: e.target.value })}
                className="w-full bg-spotify-border/50 text-sm text-white rounded-card px-3 py-2 border border-spotify-border focus:border-spotify-green focus:outline-none"
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-spotify-subtext mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-spotify-border/50 text-sm text-white rounded-card px-3 py-2 border border-spotify-border focus:border-spotify-green focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-spotify-subtext mb-2">Priority</label>
            <div className="flex gap-3">
              {PRIORITY_OPTIONS.map((p) => (
                <label key={p.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value={p.value}
                    checked={form.priority === p.value}
                    onChange={() => setForm({ ...form, priority: p.value })}
                    className="sr-only"
                  />
                  <span className={`w-3 h-3 rounded-full ${p.dot} ${form.priority === p.value ? "ring-2 ring-white ring-offset-2 ring-offset-spotify-card" : "opacity-50"}`} />
                  <span className={`text-sm ${form.priority === p.value ? "text-white" : "text-spotify-subtext"}`}>{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-spotify-subtext mb-1">Link (optional)</label>
            <input
              type="url"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="https://..."
              className="w-full bg-spotify-border/50 text-sm text-white rounded-card px-3 py-2 border border-spotify-border focus:border-spotify-green focus:outline-none placeholder:text-spotify-subtext/50"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isRecurring}
                onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                className="rounded border-spotify-border"
              />
              <span className="text-sm text-white">Recurring</span>
            </label>

            {form.isRecurring && (
              <select
                value={form.recurrencePattern}
                onChange={(e) => setForm({ ...form, recurrencePattern: e.target.value })}
                className="bg-spotify-border/50 text-sm text-white rounded-card px-3 py-1.5 border border-spotify-border focus:border-spotify-green focus:outline-none"
              >
                <option value="">Select pattern</option>
                {RECURRENCE.map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-spotify-green hover:bg-spotify-green/90 text-black font-semibold text-sm rounded-card transition-all disabled:opacity-50"
          >
            {submitting ? "Saving..." : editingId ? "Update" : "Publish"}
          </button>
        </form>
      )}

      {/* Items List */}
      {(tab === "all" || tab === "recurring") && (
        <div className="space-y-2">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="bg-spotify-card rounded-container border border-spotify-border p-8 text-center">
              <p className="text-spotify-subtext">
                {tab === "recurring" ? "No recurring items." : "No items yet. Add one to get started."}
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="bg-spotify-card rounded-card border border-spotify-border p-4 flex items-center gap-4 hover:bg-spotify-border/20 transition-colors"
              >
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${priorityDot(item.priority)}`} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-spotify-subtext">
                      {new Date(item.date).toLocaleDateString()}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-spotify-border text-spotify-subtext">
                      {TYPE_LABELS[item.itemType] ?? item.itemType}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-spotify-border text-spotify-subtext">
                      {CATEGORY_LABELS[item.category] ?? item.category}
                    </span>
                    {item.isRecurring && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-spotify-green/15 text-spotify-green">
                        {item.recurrencePattern}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(item)}
                    className="p-1.5 rounded text-spotify-subtext hover:text-white hover:bg-spotify-border transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded text-spotify-subtext hover:text-spotify-error hover:bg-spotify-error/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Trainings Tab */}
      {tab === "trainings" && (
        <div className="space-y-6">
          {/* Sub-tabs */}
          <div className="flex gap-1 bg-spotify-card/50 rounded-card p-1 w-fit">
            {(["list", "add", "stats"] as const).map((st) => (
              <button
                key={st}
                onClick={() => { setTrainingSubTab(st); if (st !== "add") setEditingTrainingId(null); }}
                className={`px-3 py-1.5 text-xs rounded-card transition-colors ${
                  trainingSubTab === st
                    ? "bg-spotify-border text-white"
                    : "text-spotify-subtext hover:text-white"
                }`}
              >
                {st === "list" ? "All Trainings" : st === "add" ? (editingTrainingId ? "Edit Training" : "Add Training") : "Stats"}
              </button>
            ))}
          </div>

          {/* Add/Edit Training Form */}
          {trainingSubTab === "add" && (
            <form onSubmit={handleTrainingSubmit} className="bg-spotify-card rounded-container border border-spotify-border p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs text-spotify-subtext mb-1">Title *</label>
                  <input
                    required
                    value={tForm.title}
                    onChange={(e) => setTForm({ ...tForm, title: e.target.value })}
                    className="w-full bg-spotify-border/50 text-sm text-white rounded-card px-3 py-2 border border-spotify-border focus:border-spotify-green focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs text-spotify-subtext mb-1">Description</label>
                  <textarea
                    value={tForm.description}
                    onChange={(e) => setTForm({ ...tForm, description: e.target.value })}
                    rows={2}
                    className="w-full bg-spotify-border/50 text-sm text-white rounded-card px-3 py-2 border border-spotify-border focus:border-spotify-green focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-spotify-subtext mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={tForm.dueDate}
                    onChange={(e) => setTForm({ ...tForm, dueDate: e.target.value })}
                    className="w-full bg-spotify-border/50 text-sm text-white rounded-card px-3 py-2 border border-spotify-border focus:border-spotify-green focus:outline-none [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-spotify-subtext mb-1">Paste Highspot Link *</label>
                  <input
                    type="url"
                    required
                    value={tForm.sourceUrl}
                    onChange={(e) => setTForm({ ...tForm, sourceUrl: e.target.value })}
                    placeholder="https://spotify.highspot.com/..."
                    className="w-full bg-spotify-border/50 text-sm text-white rounded-card px-3 py-2 border border-spotify-border focus:border-spotify-green focus:outline-none placeholder:text-spotify-subtext/50"
                  />
                </div>

                <div>
                  <label className="block text-xs text-spotify-subtext mb-1">Assigned To</label>
                  <select
                    value={tForm.assignedTo}
                    onChange={(e) => setTForm({ ...tForm, assignedTo: e.target.value })}
                    className="w-full bg-spotify-border/50 text-sm text-white rounded-card px-3 py-2 border border-spotify-border focus:border-spotify-green focus:outline-none"
                  >
                    <option value="all">Everyone</option>
                    <optgroup label="Regions">
                      {regions.map((r) => (
                        <option key={`region-${r}`} value={r}>{r}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Teams">
                      {teams.map((t) => (
                        <option key={`team-${t}`} value={t}>{t}</option>
                      ))}
                    </optgroup>
                  </select>
                  <div className="mt-1">
                    <input
                      placeholder="Or search by person..."
                      value={assignSearch}
                      onChange={(e) => setAssignSearch(e.target.value)}
                      className="w-full bg-spotify-border/50 text-xs text-white rounded-card px-3 py-1.5 border border-spotify-border focus:border-spotify-green focus:outline-none placeholder:text-spotify-subtext/50"
                    />
                    {filteredPeople.length > 0 && (
                      <div className="mt-1 bg-spotify-border rounded-card border border-spotify-border overflow-hidden">
                        {filteredPeople.map((p) => (
                          <button
                            type="button"
                            key={p.email}
                            onClick={() => {
                              setTForm({ ...tForm, assignedTo: p.email });
                              setAssignSearch("");
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-white hover:bg-spotify-card transition-colors"
                          >
                            {p.csmName} <span className="text-spotify-subtext">({p.email})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-spotify-subtext mb-1">Category</label>
                  <select
                    value={tForm.category}
                    onChange={(e) => setTForm({ ...tForm, category: e.target.value })}
                    className="w-full bg-spotify-border/50 text-sm text-white rounded-card px-3 py-2 border border-spotify-border focus:border-spotify-green focus:outline-none"
                  >
                    {TRAINING_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tForm.isRequired}
                    onChange={(e) => setTForm({ ...tForm, isRequired: e.target.checked })}
                    className="rounded border-spotify-border"
                  />
                  <span className="text-sm text-white">Required</span>
                </label>
                {tForm.assignedTo !== "all" && (
                  <span className="text-xs text-spotify-subtext">
                    Assigned to: <span className="text-white">{tForm.assignedTo}</span>
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={tSubmitting}
                className="px-6 py-2.5 bg-spotify-green hover:bg-spotify-green/90 text-black font-semibold text-sm rounded-card transition-all disabled:opacity-50"
              >
                {tSubmitting ? "Publishing..." : editingTrainingId ? "Update" : "Publish"}
              </button>
            </form>
          )}

          {/* Training List */}
          {trainingSubTab === "list" && (
            <div className="space-y-2">
              {trainingsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
                </div>
              ) : trainings.length === 0 ? (
                <div className="bg-spotify-card rounded-container border border-spotify-border p-8 text-center">
                  <p className="text-spotify-subtext">No trainings yet. Add one to get started.</p>
                </div>
              ) : (
                trainings.map((t) => {
                  const catColor = TRAINING_CAT_COLORS[t.category] ?? { bg: "bg-spotify-border", text: "text-spotify-subtext" };
                  const stat = trainingStats.find((s) => s.id === t.id);
                  return (
                    <div
                      key={t.id}
                      className="bg-spotify-card rounded-card border border-spotify-border p-4 flex items-center gap-4 hover:bg-spotify-border/20 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{t.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-spotify-subtext">
                            Due {new Date(t.dueDate).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-spotify-subtext">
                            {t.assignedTo === "all" ? "Everyone" : t.assignedTo}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${catColor.bg} ${catColor.text}`}>
                            {TRAINING_CATEGORIES.find((c) => c.value === t.category)?.label ?? t.category}
                          </span>
                          {stat && (
                            <span className="text-xs text-spotify-subtext">
                              {stat.completedCount} of {stat.totalAssigned} completed
                            </span>
                          )}
                        </div>
                        {stat && stat.totalAssigned > 0 && (
                          <div className="mt-2 h-1.5 bg-spotify-border rounded-full overflow-hidden w-full max-w-xs">
                            <div
                              className="h-full bg-spotify-green rounded-full transition-all"
                              style={{ width: `${Math.round((stat.completedCount / stat.totalAssigned) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => startEditTraining(t)}
                          className="p-1.5 rounded text-spotify-subtext hover:text-white hover:bg-spotify-border transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteTraining(t.id)}
                          className="p-1.5 rounded text-spotify-subtext hover:text-spotify-error hover:bg-spotify-error/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Training Stats */}
          {trainingSubTab === "stats" && (
            <div className="space-y-4">
              {/* Overall stats */}
              <div className="bg-spotify-card rounded-container border border-spotify-border p-5">
                <h3 className="text-sm font-semibold text-white mb-2">Overall Completion</h3>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-spotify-green">{overallRate}%</span>
                  <span className="text-xs text-spotify-subtext">{overallCompleted} of {overallTotal} completions</span>
                </div>
                <div className="mt-2 h-2 bg-spotify-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-spotify-green rounded-full transition-all"
                    style={{ width: `${overallRate}%` }}
                  />
                </div>
              </div>

              {/* Per-training stats */}
              {trainingsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
                </div>
              ) : trainingStats.length === 0 ? (
                <div className="bg-spotify-card rounded-container border border-spotify-border p-8 text-center">
                  <p className="text-spotify-subtext">No trainings to show stats for.</p>
                </div>
              ) : (
                trainingStats.map((stat) => {
                  const catColor = TRAINING_CAT_COLORS[stat.category] ?? { bg: "bg-spotify-border", text: "text-spotify-subtext" };
                  const isExpanded = expandedStat === stat.id;
                  const pct = stat.totalAssigned > 0 ? Math.round((stat.completedCount / stat.totalAssigned) * 100) : 0;

                  return (
                    <div key={stat.id} className="bg-spotify-card rounded-container border border-spotify-border overflow-hidden">
                      <button
                        onClick={() => setExpandedStat(isExpanded ? null : stat.id)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-spotify-border/20 transition-colors"
                      >
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-white truncate">{stat.title}</p>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${catColor.bg} ${catColor.text}`}>
                              {TRAINING_CATEGORIES.find((c) => c.value === stat.category)?.label ?? stat.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-spotify-subtext">
                            <span>Due {new Date(stat.dueDate).toLocaleDateString()}</span>
                            <span className="text-spotify-green">{stat.completedCount} completed</span>
                            <span className="text-spotify-warning">{stat.inProgressCount} in progress</span>
                            <span className="text-spotify-error">{stat.notStartedCount} not started</span>
                          </div>
                          <div className="mt-2 h-1.5 bg-spotify-border rounded-full overflow-hidden max-w-xs">
                            <div
                              className="h-full bg-spotify-green rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          <span className="text-sm font-semibold text-white">{pct}%</span>
                          {isExpanded ? <ChevronUp size={14} className="text-spotify-subtext" /> : <ChevronDown size={14} className="text-spotify-subtext" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-spotify-border/50 px-5 py-4">
                          <p className="text-xs text-spotify-subtext mb-2">
                            Users who haven&apos;t completed ({stat.incompleteUsers.length})
                          </p>
                          {stat.incompleteUsers.length === 0 ? (
                            <p className="text-xs text-spotify-green">Everyone has completed this training!</p>
                          ) : (
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {stat.incompleteUsers.map((u) => (
                                <div key={u.email} className="flex items-center gap-3 text-xs py-1">
                                  <span className="text-white">{u.name}</span>
                                  <span className="text-spotify-subtext">{u.email}</span>
                                  <span className="text-spotify-subtext ml-auto">{u.team}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Quick Links Management */}
          <div className="mt-8">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Link2 size={16} className="text-spotify-green" />
              Quick Links
            </h3>

            <form onSubmit={handleQuickLinkSubmit} className="bg-spotify-card rounded-container border border-spotify-border p-4 space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  placeholder="Title"
                  value={qlForm.title}
                  onChange={(e) => setQlForm({ ...qlForm, title: e.target.value })}
                  className="bg-spotify-border/50 text-sm text-white rounded-card px-3 py-2 border border-spotify-border focus:border-spotify-green focus:outline-none placeholder:text-spotify-subtext/50"
                />
                <input
                  required
                  type="url"
                  placeholder="URL"
                  value={qlForm.url}
                  onChange={(e) => setQlForm({ ...qlForm, url: e.target.value })}
                  className="bg-spotify-border/50 text-sm text-white rounded-card px-3 py-2 border border-spotify-border focus:border-spotify-green focus:outline-none placeholder:text-spotify-subtext/50"
                />
              </div>
              <input
                placeholder="Description (optional)"
                value={qlForm.description}
                onChange={(e) => setQlForm({ ...qlForm, description: e.target.value })}
                className="w-full bg-spotify-border/50 text-sm text-white rounded-card px-3 py-2 border border-spotify-border focus:border-spotify-green focus:outline-none placeholder:text-spotify-subtext/50"
              />
              <button
                type="submit"
                disabled={qlSubmitting}
                className="px-4 py-2 bg-spotify-green hover:bg-spotify-green/90 text-black font-semibold text-sm rounded-card transition-all disabled:opacity-50"
              >
                {qlSubmitting ? "Adding..." : "Add Quick Link"}
              </button>
            </form>

            {quickLinks.length === 0 ? (
              <p className="text-xs text-spotify-subtext">No quick links yet.</p>
            ) : (
              <div className="space-y-2">
                {quickLinks.map((l) => (
                  <div key={l.id} className="bg-spotify-card rounded-card border border-spotify-border p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{l.title}</p>
                      {l.description && <p className="text-xs text-spotify-subtext truncate">{l.description}</p>}
                    </div>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded text-spotify-subtext hover:text-white hover:bg-spotify-border transition-colors"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button
                      onClick={() => handleDeleteQuickLink(l.id)}
                      className="p-1.5 rounded text-spotify-subtext hover:text-spotify-error hover:bg-spotify-error/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appearance */}
      {tab === "appearance" && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Customize Appearance</h2>
          <p className="text-xs text-spotify-subtext mb-6">
            Changes apply to all users across the entire app.
          </p>
          <ThemeEditor />
        </div>
      )}

      {/* Grant Admin */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <UserPlus size={18} />
          Grant Admin Access
        </h2>
        <form onSubmit={handleGrantAdmin} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-spotify-subtext mb-1">Email address</label>
            <input
              type="email"
              required
              value={grantEmail}
              onChange={(e) => setGrantEmail(e.target.value)}
              placeholder="colleague@spotify.com"
              className="w-full bg-spotify-card border border-spotify-border rounded-card px-3 py-2 text-sm text-white placeholder:text-spotify-subtext/50 focus:border-spotify-green focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-spotify-green hover:bg-spotify-green/90 text-black font-semibold text-sm rounded-card transition-colors"
          >
            Grant
          </button>
        </form>
        {grantMsg && (
          <p className={`text-sm mt-2 ${grantMsg.includes("now an admin") ? "text-spotify-green" : "text-spotify-error"}`}>
            {grantMsg}
          </p>
        )}
      </div>
    </div>
  );
}
