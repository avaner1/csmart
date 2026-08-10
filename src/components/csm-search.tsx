"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { HandoffNotes } from "./handoff-notes";
import {
  Search,
  StickyNote,
  X,
  Mail,
  MessageSquare,
  Users,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
} from "lucide-react";

interface RosterEntry {
  id: string;
  csmName: string;
  email: string;
  manager: string;
  rho: string;
  region: string;
  level: string;
  status: string;
  title: string;
  location: string;
  team: string;
  cp: string;
  photoUrl: string | null;
}

const LEVEL_STYLE: Record<string, string> = {
  CSM: "bg-spotify-border text-spotify-subtext",
  "Senior CSM": "bg-blue-500/20 text-blue-400",
  "Lead CSM": "bg-purple-500/20 text-purple-400",
  Manager: "bg-yellow-500/20 text-yellow-400",
  RHO: "bg-spotify-green/20 text-spotify-green",
  Contractor: "bg-orange-500/20 text-orange-400",
};

const STATUS_DOT: Record<string, string> = {
  Active: "bg-spotify-green",
  "On Leave": "bg-spotify-warning",
  Departing: "bg-spotify-error",
};

const LEVEL_ORDER: Record<string, number> = {
  RHO: 0, Manager: 1, "Lead CSM": 2, "Senior CSM": 3, CSM: 4, Contractor: 5,
};

function guessEmailPrefix(name: string): string {
  const parts = name.toLowerCase().replace(/[^a-z\s-]/g, "").trim().split(/\s+/);
  if (parts.length < 2) return parts[0];
  return `${parts[0][0]}${parts[parts.length - 1]}`;
}

function CsmResultCard({ entry, searchQuery, onViewBook, onToggleNotes, showNotes }: {
  entry: RosterEntry;
  searchQuery: string;
  onViewBook: (name: string) => void;
  onToggleNotes: (id: string) => void;
  showNotes: boolean;
}) {
  const hasEmail = entry.email && entry.email.includes("@");
  const emailAddr = hasEmail ? entry.email : `${guessEmailPrefix(entry.csmName)}@spotify.com`;
  const isGuessedEmail = !hasEmail;
  const slackHandle = guessEmailPrefix(entry.csmName);
  const isManager = entry.level === "Manager" || entry.level === "RHO";
  const cpList = entry.cp ? entry.cp.split(",").map((s) => s.trim()).filter(Boolean) : [];

  function highlightMatch(text: string) {
    if (!searchQuery || searchQuery.length < 2) return text;
    const idx = text.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="text-spotify-green font-medium">{text.slice(idx, idx + searchQuery.length)}</span>
        {text.slice(idx + searchQuery.length)}
      </>
    );
  }

  return (
    <div className="bg-spotify-card rounded-card border border-spotify-border p-4 hover:bg-spotify-border/20 transition-colors">
      {entry.status === "On Leave" && (
        <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-spotify-warning/10 border border-spotify-warning/20 rounded-card">
          <Clock size={13} className="text-spotify-warning" />
          <span className="text-xs text-spotify-warning">Currently on leave</span>
        </div>
      )}
      {entry.status === "Departing" && (
        <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-spotify-error/10 border border-spotify-error/20 rounded-card">
          <AlertTriangle size={13} className="text-spotify-error" />
          <span className="text-xs text-spotify-error">Departing — check for transition notes</span>
        </div>
      )}

      <div className="flex items-start gap-3">
        {entry.photoUrl ? (
          <img src={entry.photoUrl} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-spotify-border flex-shrink-0 flex items-center justify-center text-sm font-semibold text-spotify-subtext">
            {entry.csmName.split(" ").map((w) => w[0]).join("").slice(0, 2)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-base font-semibold text-white">{highlightMatch(entry.csmName)}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${LEVEL_STYLE[entry.level] ?? LEVEL_STYLE.CSM}`}>
              {entry.level}
            </span>
            <div className={`w-2 h-2 rounded-full ${STATUS_DOT[entry.status] ?? "bg-spotify-subtext"}`} title={entry.status} />
            <span className="text-xs px-1.5 py-0.5 rounded bg-spotify-border text-spotify-subtext ml-auto">
              {entry.region}
            </span>
          </div>

          {/* Assignment */}
          {isManager && cpList.length === 0 ? (
            <p className="text-sm text-spotify-subtext mb-2">
              No direct accounts — manages {entry.team || "team"}
            </p>
          ) : cpList.length > 0 ? (
            <p className="text-sm text-spotify-subtext mb-1">
              <span className="text-xs text-spotify-subtext/70">Counterpart{cpList.length > 1 ? "s" : ""}:</span>{" "}
              {cpList.map((cp, i) => (
                <span key={cp}>
                  {i > 0 && ", "}
                  <span className="text-white">{highlightMatch(cp)}</span>
                </span>
              ))}
            </p>
          ) : null}

          {entry.team && (
            <p className="text-xs text-spotify-subtext mb-2">{highlightMatch(entry.team)}</p>
          )}

          {/* Management chain */}
          <div className="flex gap-4 text-xs text-spotify-subtext mb-3">
            {entry.manager && <span>Manager: <span className="text-white">{entry.manager}</span></span>}
            {entry.rho && <span>RHO: <span className="text-white">{entry.rho}</span></span>}
            {entry.location && <span className="truncate">{entry.location}</span>}
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`mailto:${emailAddr}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-card bg-spotify-border text-spotify-subtext hover:text-white transition-colors"
              title={isGuessedEmail ? "Email estimated — verify in Slack" : emailAddr}
            >
              <Mail size={12} />
              Email{isGuessedEmail && <span className="text-spotify-subtext/50">*</span>}
            </a>
            <a
              href={`https://slack.com/app_redirect?channel=@${slackHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-card bg-spotify-border text-spotify-subtext hover:text-white transition-colors"
            >
              <MessageSquare size={12} /> Slack
            </a>
            <button
              onClick={() => onViewBook(entry.csmName)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-card bg-spotify-border text-spotify-subtext hover:text-white transition-colors"
            >
              <Users size={12} /> View full book
            </button>
            <button
              onClick={() => onToggleNotes(entry.id)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-card bg-spotify-border text-spotify-subtext hover:text-white transition-colors"
            >
              <StickyNote size={12} /> Handoff notes
            </button>
          </div>

          {showNotes && (
            <HandoffNotes rosterId={entry.id} csmName={entry.csmName} cpField={entry.cp} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Search Component ──

interface CsmSearchProps {
  isModal?: boolean;
  onClose?: () => void;
  initialQuery?: string;
}

export function CsmSearch({ isModal = false, onClose, initialQuery = "" }: CsmSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookView, setBookView] = useState<{ name: string; entries: RosterEntry[] } | null>(null);
  const [notesOpenId, setNotesOpenId] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isModal) inputRef.current?.focus();
  }, [isModal]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    const res = await fetch(`/api/directory?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const data = await res.json();
      setResults(data.results);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  async function handleViewBook(name: string) {
    if (bookView?.name === name) { setBookView(null); return; }
    const res = await fetch(`/api/directory?q=${encodeURIComponent(name)}`);
    if (res.ok) {
      const data = await res.json();
      const entries = data.results.filter(
        (r: RosterEntry) => r.csmName.toLowerCase() === name.toLowerCase()
      );
      setBookView({ name, entries });
    }
  }

  const content = (
    <div>
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-spotify-subtext" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setBookView(null); }}
          placeholder="Search a seller, CSM, team, or market..."
          className="w-full bg-spotify-card border border-spotify-border rounded-card pl-10 pr-10 py-3 text-sm text-white placeholder:text-spotify-subtext focus:border-spotify-green focus:outline-none transition-colors"
          onKeyDown={(e) => { if (e.key === "Escape" && onClose) onClose(); }}
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); setBookView(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-spotify-subtext hover:text-white">
            <X size={16} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-5 h-5 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {results.map((entry) => (
            <div key={entry.id}>
              <CsmResultCard entry={entry} searchQuery={query} onViewBook={handleViewBook} onToggleNotes={(id) => setNotesOpenId(notesOpenId === id ? null : id)} showNotes={notesOpenId === entry.id} />
              {bookView?.name === entry.csmName && (
                <div className="ml-4 mt-2 mb-2 pl-4 border-l-2 border-spotify-green/30">
                  <p className="text-xs text-spotify-subtext font-medium mb-2">
                    All entries for {bookView.name} ({bookView.entries.length})
                  </p>
                  {bookView.entries.map((e) => (
                    <div key={e.id} className="flex items-center justify-between text-xs py-1.5">
                      <span className="text-white">{e.team}</span>
                      <span className="text-spotify-subtext">{e.cp || "—"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <p className="text-xs text-spotify-subtext/50 text-center py-1">
            * Emails marked with * are best guesses — verify in Slack
          </p>
        </div>
      ) : query.length >= 2 ? (
        <div className="text-center py-8">
          <p className="text-sm text-spotify-subtext">No matches found.</p>
          <p className="text-xs text-spotify-subtext mt-1">Try a different name, seller, or team.</p>
        </div>
      ) : (
        <div className="text-center py-8">
          <Users size={24} className="text-spotify-subtext mx-auto mb-2" />
          <p className="text-xs text-spotify-subtext">Type at least 2 characters to search</p>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-[10vh] p-4" onClick={onClose}>
        <div className="bg-spotify-darkgray border border-spotify-border rounded-container w-full max-w-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Who handles this?</h2>
            <button onClick={onClose} className="text-spotify-subtext hover:text-white"><X size={18} /></button>
          </div>
          {content}
        </div>
      </div>
    );
  }

  return content;
}

// ── Team Directory ──

interface TeamDirectoryProps {
  regionFilter?: string;
  levelFilter?: string;
  statusFilter?: string;
}

export function TeamDirectory({ regionFilter, levelFilter, statusFilter }: TeamDirectoryProps) {
  const [rows, setRows] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const params = new URLSearchParams({ all: "true" });
    if (regionFilter && regionFilter !== "all") params.set("region", regionFilter);
    if (levelFilter && levelFilter !== "all") params.set("level", levelFilter);
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

    fetch(`/api/directory?${params}`)
      .then((r) => r.json())
      .then((data) => setRows(data.results))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [regionFilter, levelFilter, statusFilter]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Group: region → team
  const regionOrder = ["North America", "EMEA", "LATAM", "JAPAC"];
  const grouped: Record<string, Record<string, RosterEntry[]>> = {};
  for (const row of rows) {
    if (!grouped[row.region]) grouped[row.region] = {};
    const team = row.team || "(No team)";
    if (!grouped[row.region][team]) grouped[row.region][team] = [];
    grouped[row.region][team].push(row);
  }

  // Sort within each team by level
  for (const region of Object.values(grouped)) {
    for (const members of Object.values(region)) {
      members.sort((a, b) => (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9));
    }
  }

  function toggleTeam(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {regionOrder.filter((r) => grouped[r]).map((region) => (
        <div key={region}>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">{region}</h3>
          <div className="space-y-1.5">
            {Object.entries(grouped[region]).map(([team, members]) => {
              const key = `${region}-${team}`;
              const isOpen = expanded.has(key);
              return (
                <div key={key} className="bg-spotify-card rounded-card border border-spotify-border overflow-hidden">
                  <button onClick={() => toggleTeam(key)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-spotify-border/20 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{team}</span>
                      <span className="text-xs text-spotify-subtext">{members.length} people</span>
                    </div>
                    {isOpen ? <ChevronUp size={14} className="text-spotify-subtext" /> : <ChevronDown size={14} className="text-spotify-subtext" />}
                  </button>

                  {isOpen && (
                    <div className="border-t border-spotify-border/50">
                      {members.map((m) => (
                        <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-spotify-border/20 last:border-0 hover:bg-spotify-border/10">
                          {m.photoUrl ? (
                            <img src={m.photoUrl} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-spotify-border flex-shrink-0 flex items-center justify-center text-xs text-spotify-subtext">
                              {m.csmName.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-white">{m.csmName}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${LEVEL_STYLE[m.level] ?? LEVEL_STYLE.CSM}`}>{m.level}</span>
                              <div className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[m.status] ?? "bg-spotify-subtext"}`} />
                            </div>
                            {m.cp && <p className="text-xs text-spotify-subtext truncate">CP: {m.cp}</p>}
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <a href={`mailto:${m.email || `${guessEmailPrefix(m.csmName)}@spotify.com`}`} className="p-1.5 rounded text-spotify-subtext hover:text-white hover:bg-spotify-border transition-colors">
                              <Mail size={13} />
                            </a>
                            <a href={`https://slack.com/app_redirect?channel=@${guessEmailPrefix(m.csmName)}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded text-spotify-subtext hover:text-white hover:bg-spotify-border transition-colors">
                              <MessageSquare size={13} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
