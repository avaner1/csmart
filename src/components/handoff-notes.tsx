"use client";

import { useState, useEffect } from "react";
import {
  StickyNote,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Archive,
  Check,
  Clock,
} from "lucide-react";
import { relativeTime } from "@/lib/time";

interface HandoffNote {
  id: string;
  cpName: string;
  content: string;
  status: string;
  priority: string;
  tags: string[];
  dueDate: string | null;
  createdAt: string;
  author: { name: string; image: string | null };
  roster: { csmName: string; team: string; cp?: string };
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-spotify-error",
  high: "bg-spotify-warning",
  normal: "bg-spotify-green",
  low: "bg-spotify-subtext",
};

const PRIORITY_LABEL: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};

const STATUS_STYLE: Record<string, string> = {
  active: "bg-spotify-green/15 text-spotify-green",
  resolved: "bg-spotify-subtext/15 text-spotify-subtext",
  archived: "bg-spotify-border text-spotify-subtext/50",
};

const TAG_SUGGESTIONS = [
  "waiting-on-client", "measurement-report", "billing-issue",
  "creative-review", "follow-up", "escalation",
  "coverage-needed", "vacation-handoff", "book-switch",
];

interface HandoffNotesProps {
  rosterId: string;
  csmName: string;
  cpField: string;
  compact?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function HandoffNotes({ rosterId, csmName, cpField, compact = false }: HandoffNotesProps) {
  const [notes, setNotes] = useState<HandoffNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [cpFilter, setCpFilter] = useState("all");

  const cpOptions = ["General", ...cpField.split(",").map((s) => s.trim()).filter(Boolean)];

  const [form, setForm] = useState({
    cpName: cpOptions[0] ?? "General",
    content: "",
    priority: "normal",
    tags: [] as string[],
    dueDate: "",
  });
  // tag input is managed inline via form.tags
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/handoff-notes?rosterId=${rosterId}`)
      .then((r) => r.json())
      .then((data) => setNotes(data.notes ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [rosterId]);

  async function handleSubmit() {
    if (!form.content.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/handoff-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rosterId,
        cpName: form.cpName,
        content: form.content,
        priority: form.priority,
        tags: form.tags,
        dueDate: form.dueDate || null,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setNotes((prev) => [data.note, ...prev]);
      setForm({ cpName: cpOptions[0] ?? "General", content: "", priority: "normal", tags: [], dueDate: "" });
      setShowForm(false);
    }
    setSubmitting(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/handoff-notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, status } : n)));
  }

  const filtered = notes.filter((n) => {
    if (n.status === "archived") return false;
    if (priorityFilter !== "all" && n.priority !== priorityFilter) return false;
    if (cpFilter !== "all" && n.cpName !== cpFilter) return false;
    return true;
  });

  const threeDaysFromNow = Date.now() + 3 * 86400000;

  if (loading) {
    return <div className="py-4 flex justify-center"><div className="w-4 h-4 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className={compact ? "" : "mt-3"}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-spotify-subtext font-medium">
          Handoff Notes ({filtered.length})
        </span>
        <button onClick={() => setShowForm(!showForm)} className="text-xs text-spotify-green hover:underline flex items-center gap-1">
          {showForm ? <><X size={11} /> Cancel</> : <><Plus size={11} /> Add Note</>}
        </button>
      </div>

      {/* Filters */}
      {notes.length > 2 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="text-xs bg-spotify-border rounded px-2 py-1 text-spotify-subtext">
            <option value="all">All priorities</option>
            {Object.entries(PRIORITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {cpOptions.length > 1 && (
            <select value={cpFilter} onChange={(e) => setCpFilter(e.target.value)} className="text-xs bg-spotify-border rounded px-2 py-1 text-spotify-subtext">
              <option value="all">All counterparts</option>
              {cpOptions.map((cp) => <option key={cp} value={cp}>{cp}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="bg-spotify-border/30 rounded-card p-3 mb-3 space-y-2">
          {cpOptions.length > 1 && (
            <select value={form.cpName} onChange={(e) => setForm({ ...form, cpName: e.target.value })} className="w-full text-xs bg-spotify-card border border-spotify-border rounded px-2 py-1.5 text-white">
              {cpOptions.map((cp) => <option key={cp} value={cp}>{cp}</option>)}
            </select>
          )}
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Leave a note about this account..."
            rows={3}
            className="w-full text-sm bg-spotify-card border border-spotify-border rounded-card px-3 py-2 text-white placeholder:text-spotify-subtext focus:border-spotify-green focus:outline-none resize-none"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-1">
              {(["urgent", "high", "normal", "low"] as const).map((p) => (
                <button key={p} onClick={() => setForm({ ...form, priority: p })}
                  className={`w-4 h-4 rounded-full ${PRIORITY_DOT[p]} ${form.priority === p ? "ring-2 ring-white ring-offset-1 ring-offset-spotify-card" : "opacity-40"}`}
                  title={PRIORITY_LABEL[p]}
                />
              ))}
            </div>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="text-xs bg-spotify-card border border-spotify-border rounded px-2 py-1 text-spotify-subtext [color-scheme:dark]"
            />
            <div className="flex gap-1 flex-wrap">
              {TAG_SUGGESTIONS.slice(0, 4).map((t) => (
                <button key={t} onClick={() => setForm({ ...form, tags: form.tags.includes(t) ? form.tags.filter((x) => x !== t) : [...form.tags, t] })}
                  className={`text-xs px-1.5 py-0.5 rounded ${form.tags.includes(t) ? "bg-spotify-green/20 text-spotify-green" : "bg-spotify-border text-spotify-subtext"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSubmit} disabled={submitting || !form.content.trim()}
            className="px-3 py-1.5 text-xs bg-spotify-green text-black font-semibold rounded-card hover:bg-spotify-green/90 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Posting..." : "Post Note"}
          </button>
        </div>
      )}

      {/* Notes list */}
      {filtered.length === 0 ? (
        <p className="text-xs text-spotify-subtext/50 py-2">No handoff notes</p>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((note) => {
            const isDueSoon = note.dueDate && new Date(note.dueDate).getTime() < threeDaysFromNow;
            return (
              <div key={note.id} className={`rounded-card p-2.5 ${note.status === "resolved" ? "opacity-50" : ""} bg-spotify-border/20`}>
                <div className="flex items-start gap-2">
                  {note.author.image ? (
                    <img src={note.author.image} alt="" className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-spotify-border flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className="text-xs font-medium text-white">{note.author.name}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[note.priority]}`} />
                      <span className="text-xs text-spotify-subtext">on {note.cpName}</span>
                      <span className={`text-xs px-1 py-0.5 rounded ${STATUS_STYLE[note.status] ?? ""}`}>{note.status}</span>
                      {isDueSoon && <span className="text-xs text-spotify-warning flex items-center gap-0.5"><Clock size={10} /> Due soon</span>}
                      <span className="text-xs text-spotify-subtext/50 ml-auto">{relativeTime(String(new Date(note.createdAt).getTime() / 1000))}</span>
                    </div>
                    <p className="text-xs text-spotify-subtext whitespace-pre-wrap">{note.content}</p>
                    {note.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {note.tags.map((t) => <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-spotify-border text-spotify-subtext">{t}</span>)}
                      </div>
                    )}
                    <div className="flex gap-2 mt-1.5">
                      {note.status === "active" && (
                        <button onClick={() => updateStatus(note.id, "resolved")} className="text-xs text-spotify-subtext hover:text-spotify-green flex items-center gap-0.5">
                          <Check size={10} /> Resolve
                        </button>
                      )}
                      {note.status !== "archived" && (
                        <button onClick={() => updateStatus(note.id, "archived")} className="text-xs text-spotify-subtext hover:text-white flex items-center gap-0.5">
                          <Archive size={10} /> Archive
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Dashboard card version
export function HandoffNotesDashboard() {
  const [data, setData] = useState<{
    onMyAccounts: HandoffNote[];
    coveringNotes: HandoffNote[];
    myAuthoredNotes: HandoffNote[];
    newSinceLogin: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/handoff-notes/my-accounts")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-spotify-card rounded-card border border-spotify-border border-l-4 border-l-yellow-500 p-5">
        <div className="flex justify-center py-4"><div className="w-4 h-4 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" /></div>
      </div>
    );
  }

  const onMine = data?.onMyAccounts ?? [];
  const covering = data?.coveringNotes ?? [];
  const authored = data?.myAuthoredNotes ?? [];
  const total = onMine.length + covering.length;

  return (
    <div className="bg-spotify-card rounded-card border border-spotify-border border-l-4 border-l-yellow-500 p-5 flex flex-col hover:translate-y-[-2px] hover:shadow-lg hover:shadow-black/20 transition-all duration-200">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
        <StickyNote size={15} className="text-yellow-500" />
        Handoff Notes
      </h3>

      {total === 0 && authored.length === 0 ? (
        <p className="text-xs text-spotify-subtext flex-1">No handoff notes on your accounts</p>
      ) : (
        <div className="flex-1">
          {onMine.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-spotify-subtext/70 mb-1">On your accounts ({onMine.length})</p>
              {onMine.slice(0, expanded ? 10 : 2).map((n) => (
                <NotePreview key={n.id} note={n} />
              ))}
            </div>
          )}
          {covering.length > 0 && (
            <div className="mb-2">
              <p className="text-xs text-spotify-subtext/70 mb-1">Covering ({covering.length})</p>
              {covering.slice(0, 2).map((n) => (
                <NotePreview key={n.id} note={n} />
              ))}
            </div>
          )}
          {authored.length > 0 && (
            <div>
              <p className="text-xs text-spotify-subtext/70 mb-1">Notes you left ({authored.length})</p>
              {authored.slice(0, 2).map((n) => (
                <NotePreview key={n.id} note={n} showTarget />
              ))}
            </div>
          )}
          {(onMine.length > 2 || authored.length > 2) && (
            <button onClick={() => setExpanded(!expanded)} className="text-xs text-spotify-green hover:underline mt-1 flex items-center gap-0.5">
              {expanded ? <>Less <ChevronUp size={10} /></> : <>Show all <ChevronDown size={10} /></>}
            </button>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-spotify-border/50">
        <a href="/directory" className="text-xs text-spotify-green hover:underline">View all in Directory &rarr;</a>
      </div>
    </div>
  );
}

function NotePreview({ note, showTarget }: { note: HandoffNote; showTarget?: boolean }) {
  const isDueSoon = note.dueDate && new Date(note.dueDate).getTime() < Date.now() + 3 * 86400000;
  return (
    <div className="flex items-start gap-2 py-1">
      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[note.priority]}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-white">{note.cpName}</span>
          {showTarget && <span className="text-xs text-spotify-subtext">→ {note.roster.csmName}</span>}
          {isDueSoon && <Clock size={10} className="text-spotify-warning" />}
          <span className="text-xs text-spotify-subtext/50 ml-auto">{relativeTime(String(new Date(note.createdAt).getTime() / 1000))}</span>
        </div>
        <p className="text-xs text-spotify-subtext line-clamp-1">{note.content}</p>
      </div>
    </div>
  );
}

// Alert banner for new notes since login
export function HandoffAlertBanner() {
  const [data, setData] = useState<{ newSinceLogin: number; urgentNote: HandoffNote | null } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/handoff-notes/my-accounts")
      .then((r) => r.json())
      .then((d) => {
        const onMine: HandoffNote[] = d.onMyAccounts ?? [];
        const urgent = onMine.find((n) => n.priority === "urgent") ?? null;
        setData({ newSinceLogin: d.newSinceLogin ?? 0, urgentNote: urgent });
      })
      .catch(() => {});
  }, []);

  if (!data || data.newSinceLogin === 0 || dismissed) return null;

  const hasUrgent = data.urgentNote !== null;

  return (
    <div className={`rounded-card px-4 py-3 mb-4 flex items-center justify-between ${hasUrgent ? "bg-spotify-error/10 border border-spotify-error/20" : "bg-yellow-500/10 border border-yellow-500/20"}`}>
      <div className="flex items-center gap-3 min-w-0">
        <StickyNote size={16} className={hasUrgent ? "text-spotify-error" : "text-yellow-500"} />
        <div className="min-w-0">
          <p className={`text-sm font-medium ${hasUrgent ? "text-spotify-error" : "text-yellow-500"}`}>
            {data.newSinceLogin} new handoff note{data.newSinceLogin > 1 ? "s" : ""} on your accounts
          </p>
          {data.urgentNote && (
            <p className="text-xs text-spotify-subtext truncate mt-0.5">
              {data.urgentNote.cpName}: {data.urgentNote.content}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <a href="/directory" className={`text-xs px-3 py-1.5 rounded-card font-medium ${hasUrgent ? "bg-spotify-error text-black" : "bg-yellow-500 text-black"}`}>
          View all
        </a>
        <button onClick={() => setDismissed(true)} className="text-spotify-subtext hover:text-white"><X size={16} /></button>
      </div>
    </div>
  );
}
