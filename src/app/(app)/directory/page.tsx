"use client";

import { useState } from "react";
import { CsmSearch, TeamDirectory } from "@/components/csm-search";

const REGIONS = ["all", "North America", "EMEA", "LATAM", "JAPAC"];
const LEVELS = ["all", "CSM", "Senior CSM", "Lead CSM", "Manager", "RHO", "Contractor"];
const STATUSES = ["all", "Active", "On Leave", "Departing"];

export default function DirectoryPage() {
  const [region, setRegion] = useState("all");
  const [level, setLevel] = useState("all");
  const [status, setStatus] = useState("all");

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-2">Directory</h1>
      <p className="text-spotify-subtext mb-6">
        Find who handles any account, seller, or team.
      </p>

      <CsmSearch />

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-white mb-4">Team Directory</h2>

        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="bg-spotify-card border border-spotify-border rounded-card px-3 py-1.5 text-sm text-white focus:border-spotify-green focus:outline-none"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r === "all" ? "All Regions" : r}</option>
            ))}
          </select>

          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="bg-spotify-card border border-spotify-border rounded-card px-3 py-1.5 text-sm text-white focus:border-spotify-green focus:outline-none"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l === "all" ? "All Levels" : l}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-spotify-card border border-spotify-border rounded-card px-3 py-1.5 text-sm text-white focus:border-spotify-green focus:outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All Statuses" : s}</option>
            ))}
          </select>
        </div>

        <TeamDirectory
          regionFilter={region}
          levelFilter={level}
          statusFilter={status}
        />
      </div>
    </div>
  );
}
