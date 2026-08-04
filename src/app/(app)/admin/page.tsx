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

function priorityDot(p: string) {
  const opt = PRIORITY_OPTIONS.find((o) => o.value === p);
  return opt?.dot ?? "bg-spotify-subtext";
}

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"all" | "add" | "recurring" | "appearance">("all");
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isAdmin) return;
    fetchItems();
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

  if (isAdmin === null) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs = [
    { key: "all" as const, label: "All Items", icon: List },
    { key: "add" as const, label: editingId ? "Edit Item" : "Add New", icon: Plus },
    { key: "recurring" as const, label: "Recurring Items", icon: RefreshCw },
    { key: "appearance" as const, label: "Appearance", icon: Paintbrush },
  ];

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-6">Admin</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-spotify-card rounded-card p-1 w-fit">
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
