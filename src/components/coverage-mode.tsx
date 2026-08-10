"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, RefreshCw } from "lucide-react";

interface CoveredPerson {
  csmName: string;
  team: string;
  cp: string;
  photoUrl: string | null;
  status: string;
  region: string;
}

interface RosterEntry {
  id: string;
  csmName: string;
  team: string;
  photoUrl: string | null;
  status: string;
}

export function CoverageMode() {
  const [covering, setCovering] = useState<CoveredPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RosterEntry[]>([]);
  const [, setSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetch("/api/coverage")
      .then((r) => r.json())
      .then((d) => setCovering(d.coveringFor ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/directory?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results.filter((r: RosterEntry) =>
          !covering.some((c) => c.csmName === r.csmName)
        ));
      }
      setSearching(false);
    }, 300);
  }, [searchQuery, covering]);

  async function addCoverage(csmName: string) {
    await fetch("/api/coverage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csmName, action: "add" }),
    });
    setSearchQuery("");
    setSearchResults([]);
    // Refresh
    const res = await fetch("/api/coverage");
    if (res.ok) {
      const d = await res.json();
      setCovering(d.coveringFor ?? []);
    }
  }

  async function removeCoverage(csmName: string) {
    await fetch("/api/coverage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csmName, action: "remove" }),
    });
    setCovering((prev) => prev.filter((c) => c.csmName !== csmName));
  }

  if (loading) {
    return <div className="py-4 flex justify-center"><div className="w-4 h-4 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="bg-spotify-card rounded-container border border-spotify-border p-6">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
        <RefreshCw size={15} className="text-spotify-green" />
        Coverage Mode
      </h3>

      {/* Search to add */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-spotify-subtext" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="I'm covering for..."
          className="w-full bg-spotify-border/50 border border-spotify-border rounded-card pl-9 pr-4 py-2 text-sm text-white placeholder:text-spotify-subtext focus:border-spotify-green focus:outline-none"
        />
        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-spotify-card border border-spotify-border rounded-card shadow-xl z-10 py-1 max-h-48 overflow-y-auto">
            {searchResults.slice(0, 8).map((r) => (
              <button
                key={r.id}
                onClick={() => addCoverage(r.csmName)}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-spotify-border/50 transition-colors"
              >
                {r.photoUrl ? (
                  <img src={r.photoUrl} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-spotify-border" />
                )}
                <div>
                  <p className="text-sm text-white">{r.csmName}</p>
                  <p className="text-xs text-spotify-subtext">{r.team}</p>
                </div>
                {(r.status === "On Leave" || r.status === "Departing") && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ml-auto ${r.status === "On Leave" ? "bg-spotify-warning/15 text-spotify-warning" : "bg-spotify-error/15 text-spotify-error"}`}>
                    {r.status}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Currently covering */}
      {covering.length === 0 ? (
        <p className="text-xs text-spotify-subtext">
          Not covering for anyone. Search above to add coverage.
        </p>
      ) : (
        <div className="space-y-2">
          {covering.map((c) => (
            <div key={c.csmName} className="flex items-center gap-3 bg-spotify-border/30 rounded-card px-3 py-2.5">
              {c.photoUrl ? (
                <img src={c.photoUrl} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-spotify-border flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white">{c.csmName}</p>
                <p className="text-xs text-spotify-subtext">{c.team} · {c.region}</p>
              </div>
              <button
                onClick={() => removeCoverage(c.csmName)}
                className="text-xs text-spotify-subtext hover:text-spotify-error flex items-center gap-1 flex-shrink-0"
              >
                <X size={12} /> Stop
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
