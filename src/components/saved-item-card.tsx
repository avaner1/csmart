"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Mail,
  Calendar,
  MoreHorizontal,
  ExternalLink,
  Tag,
  StickyNote,
  Archive,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { relativeTime } from "@/lib/time";

const TAG_SUGGESTIONS = [
  "follow-up",
  "waiting-on-response",
  "book-switch",
  "solution-found",
  "reference",
  "cross-reference",
  "urgent",
];

const TAG_COLORS: Record<string, string> = {
  "follow-up": "bg-blue-500/20 text-blue-400",
  "waiting-on-response": "bg-orange-500/20 text-orange-400",
  "book-switch": "bg-purple-500/20 text-purple-400",
  "solution-found": "bg-spotify-green/20 text-spotify-green",
  reference: "bg-cyan-500/20 text-cyan-400",
  "cross-reference": "bg-pink-500/20 text-pink-400",
  urgent: "bg-spotify-error/20 text-spotify-error",
};

const SOURCE_ICONS: Record<string, typeof MessageSquare> = {
  slack: MessageSquare,
  gmail: Mail,
  calendar: Calendar,
  manual: StickyNote,
};

const SOURCE_COLORS: Record<string, string> = {
  slack: "bg-purple-500/20 text-purple-400",
  gmail: "bg-red-500/20 text-red-400",
  calendar: "bg-blue-500/20 text-blue-400",
  manual: "bg-spotify-green/20 text-spotify-green",
};

interface SavedItemCardProps {
  id: string;
  sourceType: string;
  title: string;
  content: string;
  sourceUrl: string | null;
  tags: string[];
  notes: string | null;
  savedAt: string;
  matchedKeyword?: string | null;
  onUpdate: (id: string, data: { tags?: string[]; notes?: string; isArchived?: boolean }) => void;
  onDelete: (id: string) => void;
}

export function SavedItemCard({
  id,
  sourceType,
  title,
  content,
  sourceUrl,
  tags,
  notes,
  savedAt,
  matchedKeyword,
  onUpdate,
  onDelete,
}: SavedItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [currentTags, setCurrentTags] = useState(tags);
  const [currentNotes, setCurrentNotes] = useState(notes ?? "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const SourceIcon = SOURCE_ICONS[sourceType] ?? MessageSquare;
  const sourceColor = SOURCE_COLORS[sourceType] ?? "bg-spotify-border text-spotify-subtext";

  const filteredSuggestions = TAG_SUGGESTIONS.filter(
    (s) => !currentTags.includes(s) && s.includes(tagInput.toLowerCase())
  );

  function addTag(tag: string) {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || currentTags.includes(trimmed)) return;
    const updated = [...currentTags, trimmed];
    setCurrentTags(updated);
    setTagInput("");
    onUpdate(id, { tags: updated });
  }

  function removeTag(tag: string) {
    const updated = currentTags.filter((t) => t !== tag);
    setCurrentTags(updated);
    onUpdate(id, { tags: updated });
  }

  function saveNotes() {
    onUpdate(id, { notes: currentNotes });
    setEditingNotes(false);
  }

  return (
    <div className="bg-spotify-card rounded-card border border-spotify-border p-4 transition-all duration-200 hover:bg-spotify-border/20">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-card flex items-center justify-center flex-shrink-0 ${sourceColor}`}>
          <SourceIcon size={16} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-left flex-1 min-w-0"
            >
              <p className="text-sm font-semibold text-white truncate">
                {title}
              </p>
              {!expanded && (
                <p className="text-sm text-spotify-subtext line-clamp-2 mt-0.5">
                  {content}
                </p>
              )}
            </button>

            <div className="flex items-center gap-2 flex-shrink-0">
              {matchedKeyword && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-spotify-green/15 text-spotify-green">
                  {matchedKeyword}
                </span>
              )}
              <span className="text-xs text-spotify-subtext">
                {relativeTime(String(new Date(savedAt).getTime() / 1000))}
              </span>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="p-1 rounded text-spotify-subtext hover:text-white hover:bg-spotify-border transition-colors"
                >
                  <MoreHorizontal size={16} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-spotify-card border border-spotify-border rounded-card shadow-xl z-20 py-1 w-44">
                    <button
                      onClick={() => { setEditingTags(true); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-spotify-subtext hover:text-white hover:bg-spotify-border/50 transition-colors"
                    >
                      <Tag size={14} /> Edit Tags
                    </button>
                    <button
                      onClick={() => { setEditingNotes(true); setExpanded(true); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-spotify-subtext hover:text-white hover:bg-spotify-border/50 transition-colors"
                    >
                      <StickyNote size={14} /> Add Note
                    </button>
                    <button
                      onClick={() => { onUpdate(id, { isArchived: true }); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-spotify-subtext hover:text-white hover:bg-spotify-border/50 transition-colors"
                    >
                      <Archive size={14} /> Archive
                    </button>
                    {sourceUrl && (
                      <a
                        href={sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-spotify-subtext hover:text-white hover:bg-spotify-border/50 transition-colors"
                      >
                        <ExternalLink size={14} /> Open Original
                      </a>
                    )}
                    <button
                      onClick={() => { onDelete(id); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-spotify-error hover:bg-spotify-error/10 transition-colors"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {expanded && (
            <div className="mt-3">
              <p className="text-sm text-spotify-subtext whitespace-pre-wrap break-words">
                {content}
              </p>

              {(currentNotes || editingNotes) && (
                <div className="mt-3 pl-3 border-l-2 border-spotify-green/30">
                  {editingNotes ? (
                    <div className="space-y-2">
                      <textarea
                        value={currentNotes}
                        onChange={(e) => setCurrentNotes(e.target.value)}
                        placeholder="Add a personal note..."
                        className="w-full bg-spotify-border/50 text-sm text-spotify-subtext rounded-card p-2 border border-spotify-border focus:border-spotify-green focus:outline-none resize-none"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveNotes}
                          className="text-xs px-3 py-1 bg-spotify-green text-black font-medium rounded hover:bg-spotify-green/90 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingNotes(false); setCurrentNotes(notes ?? ""); }}
                          className="text-xs px-3 py-1 text-spotify-subtext hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-spotify-subtext italic">
                      {currentNotes}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={() => setExpanded(false)}
                className="text-xs text-spotify-green hover:text-spotify-green/80 mt-2 flex items-center gap-0.5"
              >
                Collapse <ChevronUp size={12} />
              </button>
            </div>
          )}

          {!expanded && currentNotes && (
            <p className="text-xs text-spotify-subtext italic mt-1 pl-3 border-l-2 border-spotify-green/30 truncate">
              {currentNotes}
            </p>
          )}

          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {currentTags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                  TAG_COLORS[tag] ?? "bg-spotify-border text-spotify-subtext"
                }`}
              >
                {tag}
                {editingTags && (
                  <button onClick={() => removeTag(tag)} className="hover:opacity-70">
                    <X size={10} />
                  </button>
                )}
              </span>
            ))}

            {!expanded && !editingTags && content.length > 100 && (
              <button
                onClick={() => setExpanded(true)}
                className="text-xs text-spotify-subtext hover:text-spotify-green flex items-center gap-0.5 ml-auto"
              >
                <ChevronDown size={12} />
              </button>
            )}
          </div>

          {editingTags && (
            <div className="mt-2 relative">
              <input
                ref={tagInputRef}
                type="text"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                  if (e.key === "Escape") setEditingTags(false);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Type a tag and press Enter..."
                className="w-full bg-spotify-border/50 text-sm text-white rounded-card px-3 py-1.5 border border-spotify-border focus:border-spotify-green focus:outline-none"
                autoFocus
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-spotify-card border border-spotify-border rounded-card shadow-xl z-10 py-1">
                  {filteredSuggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => { addTag(s); setShowSuggestions(false); }}
                      className="w-full text-left px-3 py-1.5 text-sm text-spotify-subtext hover:text-white hover:bg-spotify-border/50 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setEditingTags(false)}
                className="text-xs text-spotify-subtext hover:text-white mt-1"
              >
                Done editing tags
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
