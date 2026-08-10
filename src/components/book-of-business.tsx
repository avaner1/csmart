"use client";

import { useEffect, useState } from "react";
import { Users, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

interface BookData {
  autoMatched: boolean;
  vertical: string | null;
  csManager: string | null;
  rhoCs: string | null;
  roster: {
    csmName: string;
    level: string;
    team: string;
    region: string;
    cp: string;
  } | null;
  accounts: { corporateBrand: string; cp: string }[];
  totalAccounts: number;
}

interface BookOfBusinessProps {
  compact?: boolean;
}

export function BookOfBusiness({ compact = false }: BookOfBusinessProps) {
  const [data, setData] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!compact);

  useEffect(() => {
    fetch("/api/book")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-spotify-card rounded-container border border-spotify-border p-6">
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-spotify-green border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!data || data.totalAccounts === 0) {
    return (
      <div className="bg-spotify-card rounded-container border border-spotify-border p-6">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-spotify-warning mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-white font-medium mb-1">
              No book of business found
            </p>
            <p className="text-sm text-spotify-subtext">
              We couldn&apos;t auto-match your name to the CSM Roster.
              Contact your manager if your alignment is missing.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-spotify-card rounded-container border border-spotify-border p-5 hover:bg-spotify-border/20 transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-spotify-green" />
            <h3 className="text-sm font-semibold text-white">My Book</h3>
          </div>
          <span className="text-xs text-spotify-subtext">
            {data.totalAccounts} accounts
          </span>
        </div>

        {data.roster && (
          <p className="text-sm text-spotify-subtext mb-1">
            {data.roster.team} · {data.roster.region}
          </p>
        )}

        {data.csManager && (
          <p className="text-xs text-spotify-subtext">
            Manager: <span className="text-white">{data.csManager}</span>
          </p>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-spotify-green hover:text-spotify-green/80 mt-3 flex items-center gap-0.5"
        >
          {expanded ? (
            <>Hide details <ChevronUp size={12} /></>
          ) : (
            <>Show accounts <ChevronDown size={12} /></>
          )}
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-spotify-border/50 space-y-1 max-h-48 overflow-y-auto">
            {data.accounts.map((a) => (
              <div key={a.corporateBrand} className="flex items-center justify-between text-sm">
                <span className="text-white truncate">{a.corporateBrand}</span>
                <span className="text-xs text-spotify-subtext flex-shrink-0 ml-2">{a.cp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full view for Settings page
  return (
    <div className="bg-spotify-card rounded-container border border-spotify-border p-6">
      {data.autoMatched && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-spotify-green/10 border border-spotify-green/20 rounded-card">
          <Users size={16} className="text-spotify-green flex-shrink-0" />
          <p className="text-sm text-spotify-green">
            Your book was auto-populated from the Global CSM Roster.
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-xs text-spotify-subtext mb-1">Team</p>
          <p className="text-sm text-white font-medium">
            {data.vertical ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-spotify-subtext mb-1">Manager</p>
          <p className="text-sm text-white font-medium">
            {data.csManager ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-spotify-subtext mb-1">RHO</p>
          <p className="text-sm text-white font-medium">
            {data.rhoCs ?? "—"}
          </p>
        </div>
      </div>

      {data.roster && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-xs text-spotify-subtext mb-1">Level</p>
            <p className="text-sm text-white font-medium">{data.roster.level}</p>
          </div>
          <div>
            <p className="text-xs text-spotify-subtext mb-1">Region</p>
            <p className="text-sm text-white font-medium">{data.roster.region}</p>
          </div>
          <div>
            <p className="text-xs text-spotify-subtext mb-1">Counterpart</p>
            <p className="text-sm text-white font-medium">{data.roster.cp || "—"}</p>
          </div>
        </div>
      )}

      <h3 className="text-sm font-semibold text-white mb-3">
        Accounts ({data.totalAccounts})
      </h3>

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {data.accounts.map((a) => (
          <div
            key={a.corporateBrand}
            className="flex items-center justify-between bg-spotify-border/30 rounded-card px-3 py-2"
          >
            <span className="text-sm text-white truncate">{a.corporateBrand}</span>
            <span className="text-xs text-spotify-subtext flex-shrink-0 ml-2">{a.cp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
