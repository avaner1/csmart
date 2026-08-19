"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Bookmark, ChevronDown } from "lucide-react";
import { SavedItemCard } from "@/components/saved-item-card";

interface SavedItem {
  id: string;
  sourceType: string;
  sourceId: string | null;
  title: string;
  content: string;
  sourceUrl: string | null;
  tags: string[];
  notes: string | null;
  isArchived: boolean;
  savedAt: string;
}

const SOURCE_FILTERS = [
  { key: "all", label: "All" },
  { key: "foryou", label: "For You" },
  { key: "slack", label: "Slack" },
  { key: "gmail", label: "Gmail", disabled: true },
  { key: "calendar", label: "Calendar", disabled: true },
  { key: "archived", label: "Archived" },
];

export default function SavedPage() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  // syncing state removed — stars sync runs silently in background
  const [syncResult, setSyncResult] = useState<{ imported: number } | null>(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [bookKeywords, setBookKeywords] = useState<string[]>([]);
  const debounceRef = useRef<NodeJS.Timeout>();
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const hasSynced = useRef(false);

  // Sync Slack starred items on first visit (stars only — Slack's "Save for later" has no API)
  useEffect(() => {
    if (hasSynced.current) return;
    hasSynced.current = true;

    fetch("/api/slack/sync-stars", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.imported > 0) {
          setSyncResult({ imported: data.imported });
          setTimeout(() => setSyncResult(null), 8000);
          fetchItems(search);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/book")
      .then((r) => r.json())
      .then((data) => {
        if (data.keywords) {
          setBookKeywords(
            data.keywords.map((k: string) => k.toLowerCase())
          );
        }
      })
      .catch(() => {});
  }, []);

  const fetchItems = useCallback(
    async (searchQuery?: string) => {
      const params = new URLSearchParams();

      if (activeFilter === "archived") {
        params.set("isArchived", "true");
      } else if (activeFilter === "foryou" || activeFilter === "all") {
        // fetch all, filter client-side for "foryou"
      } else {
        params.set("sourceType", activeFilter);
      }

      if (searchQuery) params.set("search", searchQuery);
      if (selectedTags.length === 1) params.set("tag", selectedTags[0]);

      const res = await fetch(`/api/saved?${params}`);
      if (!res.ok) return;

      const data = await res.json();

      let filtered = data.items;
      if (selectedTags.length > 1) {
        filtered = filtered.filter((item: SavedItem) =>
          selectedTags.every((t) => item.tags.includes(t))
        );
      }

      if (activeFilter === "foryou" && bookKeywords.length > 0) {
        filtered = filtered.filter((item: SavedItem) => {
          const text = `${item.title} ${item.content}`.toLowerCase();
          return bookKeywords.some((kw) => text.includes(kw));
        });
      }

      setItems(filtered);
      setAllTags(data.allTags ?? []);
      setTotal(data.total ?? 0);
      setLoading(false);
    },
    [activeFilter, selectedTags, bookKeywords]
  );

  useEffect(() => {
    setLoading(true);
    fetchItems(search);
  }, [fetchItems, activeFilter, selectedTags]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchItems(search);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, fetchItems]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setTagDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleUpdate(
    id: string,
    data: { tags?: string[]; notes?: string; isArchived?: boolean }
  ) {
    await fetch(`/api/saved/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (data.isArchived && activeFilter !== "archived") {
      setItems((prev) => prev.filter((i) => i.id !== id));
      setTotal((t) => t - 1);
    } else {
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...data } : i))
      );
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/saved/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setTotal((t) => t - 1);
  }

  function toggleTagFilter(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function getMatchedKeyword(item: SavedItem): string | null {
    if (bookKeywords.length === 0) return null;
    const text = `${item.title} ${item.content}`.toLowerCase();
    return bookKeywords.find((kw) => text.includes(kw)) ?? null;
  }

  if (loading && items.length === 0) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-white mb-2">Saved for Later</h1>
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-baseline gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">Saved for Later</h1>
        {total > 0 && (
          <span className="text-sm text-spotify-subtext">{total} items</span>
        )}
      </div>

      {/* Import result */}
      {syncResult && (
        <div className="mb-4 px-4 py-3 bg-spotify-green/10 border border-spotify-green/20 rounded-card">
          <p className="text-sm text-spotify-green">
            Imported {syncResult.imported} starred message{syncResult.imported > 1 ? "s" : ""} from Slack
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-spotify-subtext"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search titles, content, notes, and tags..."
          className="w-full bg-spotify-card border border-spotify-border rounded-card pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-spotify-subtext focus:border-spotify-green focus:outline-none transition-colors"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {SOURCE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => !f.disabled && setActiveFilter(f.key)}
            disabled={f.disabled}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              f.disabled
                ? "bg-spotify-border/30 text-spotify-subtext/40 cursor-not-allowed"
                : activeFilter === f.key
                ? "bg-spotify-green text-black font-medium"
                : "bg-spotify-card border border-spotify-border text-spotify-subtext hover:text-white hover:border-spotify-subtext"
            }`}
          >
            {f.label}
          </button>
        ))}

        {/* Tag filter dropdown */}
        {allTags.length > 0 && (
          <div className="relative ml-2" ref={tagDropdownRef}>
            <button
              onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-full border transition-colors ${
                selectedTags.length > 0
                  ? "bg-spotify-green/20 border-spotify-green/40 text-spotify-green"
                  : "bg-spotify-card border-spotify-border text-spotify-subtext hover:text-white"
              }`}
            >
              Tags
              {selectedTags.length > 0 && (
                <span className="text-xs">({selectedTags.length})</span>
              )}
              <ChevronDown size={14} />
            </button>

            {tagDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 bg-spotify-card border border-spotify-border rounded-card shadow-xl z-20 py-1 w-52">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTagFilter(tag)}
                    className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                      selectedTags.includes(tag)
                        ? "text-spotify-green bg-spotify-green/10"
                        : "text-spotify-subtext hover:text-white hover:bg-spotify-border/50"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Item list */}
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => {
            const matchedKeyword = getMatchedKeyword(item);
            return (
              <SavedItemCard
                key={item.id}
                id={item.id}
                sourceType={item.sourceType}
                title={item.title}
                content={item.content}
                sourceUrl={item.sourceUrl}
                tags={item.tags}
                notes={item.notes}
                savedAt={item.savedAt}
                matchedKeyword={matchedKeyword}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-spotify-card border border-spotify-border flex items-center justify-center mb-6">
            <Bookmark size={28} className="text-spotify-subtext" />
          </div>
          {search || activeFilter !== "all" || selectedTags.length > 0 ? (
            <>
              <h3 className="text-lg font-semibold text-white mb-2">
                No matching items
              </h3>
              <p className="text-sm text-spotify-subtext max-w-md">
                Try adjusting your search or filters.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold text-white mb-2">
                Your saved items will appear here
              </h3>
              <p className="text-sm text-spotify-subtext max-w-md leading-relaxed mb-3">
                Bookmark Slack messages so they never disappear — even after
                Slack&apos;s retention window expires. Perfect for switching
                between books, waiting on responses, or keeping solutions you
                might need again.
              </p>
              <p className="text-xs text-spotify-subtext/70 max-w-md leading-relaxed">
                Two ways to save: use the bookmark button on any message in CSmart,
                or right-click a message in Slack → More actions → &quot;Save to CSmart&quot;.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
