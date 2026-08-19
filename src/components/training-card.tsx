"use client";

import { useState } from "react";
import { ExternalLink, Check, Clock } from "lucide-react";

interface TrainingCardProps {
  id: string;
  title: string;
  description?: string;
  sourceUrl: string;
  dueDate: string;
  category: string;
  isRequired: boolean;
  myStatus: string;
  compact?: boolean;
  onStatusChange?: (id: string, newStatus: string) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  certification: { bg: "bg-purple-400/15", text: "text-purple-400" },
  "product-training": { bg: "bg-blue-400/15", text: "text-blue-400" },
  onboarding: { bg: "bg-green-400/15", text: "text-green-400" },
  compliance: { bg: "bg-red-400/15", text: "text-red-400" },
  "skill-development": { bg: "bg-teal-400/15", text: "text-teal-400" },
};

const CATEGORY_LABELS: Record<string, string> = {
  certification: "Certification",
  "product-training": "Product Training",
  onboarding: "Onboarding",
  compliance: "Compliance",
  "skill-development": "Skill Development",
};

function getDueInfo(dueDate: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: "OVERDUE", className: "text-spotify-error font-semibold" };
  if (diffDays === 0) return { text: "Due today", className: "text-spotify-warning font-medium" };
  if (diffDays === 1) return { text: "Due tomorrow", className: "text-spotify-warning" };
  if (diffDays <= 7) return { text: `Due in ${diffDays} days`, className: "text-spotify-warning" };
  return { text: `Due ${due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`, className: "text-spotify-subtext" };
}

function StatusDot({ status }: { status: string }) {
  if (status === "completed") return <div className="w-2.5 h-2.5 rounded-full bg-spotify-green flex-shrink-0" />;
  if (status === "in-progress") return <div className="w-2.5 h-2.5 rounded-full bg-spotify-warning flex-shrink-0" />;
  return <div className="w-2.5 h-2.5 rounded-full bg-spotify-error flex-shrink-0" />;
}

export function TrainingCard({
  id,
  title,
  sourceUrl,
  dueDate,
  category,
  isRequired,
  myStatus,
  compact,
  onStatusChange,
}: TrainingCardProps) {
  const [status, setStatus] = useState(myStatus);
  const [updating, setUpdating] = useState(false);
  const dueInfo = getDueInfo(dueDate);
  const catColor = CATEGORY_COLORS[category] ?? { bg: "bg-spotify-border", text: "text-spotify-subtext" };
  const isCompleted = status === "completed";

  async function updateStatus(newStatus: string) {
    setUpdating(true);
    const res = await fetch(`/api/trainings/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setStatus(newStatus);
      onStatusChange?.(id, newStatus);
    }
    setUpdating(false);
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${isCompleted ? "opacity-50" : ""}`}>
        <StatusDot status={status} />
        <span className={`text-xs flex-1 truncate ${isCompleted ? "line-through text-spotify-subtext" : "text-white"}`}>
          {title}
        </span>
        <span className={`text-xs flex-shrink-0 ${dueInfo.className}`}>{dueInfo.text}</span>
        {!isCompleted && (
          <button
            onClick={() => updateStatus("completed")}
            disabled={updating}
            className="text-xs px-2 py-0.5 rounded bg-spotify-green/15 text-spotify-green hover:bg-spotify-green/25 transition-colors flex-shrink-0 disabled:opacity-50"
          >
            Done
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`bg-spotify-card rounded-card border border-spotify-border p-4 hover:bg-spotify-border/20 transition-colors ${
        isCompleted ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <StatusDot status={status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className={`text-sm font-semibold ${isCompleted ? "line-through text-spotify-subtext" : "text-white"}`}>
              {isCompleted && <Check size={14} className="inline text-spotify-green mr-1" />}
              {title}
            </p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${catColor.bg} ${catColor.text}`}>
              {CATEGORY_LABELS[category] ?? category}
            </span>
            {isRequired && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-spotify-error/15 text-spotify-error">
                Required
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mb-2">
            <span className={`text-xs ${dueInfo.className}`}>{dueInfo.text}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-card bg-spotify-border text-spotify-subtext hover:text-white hover:bg-spotify-border/80 transition-colors"
            >
              <ExternalLink size={11} />
              Open in Highspot
            </a>

            {status === "not-started" && (
              <>
                <button
                  onClick={() => updateStatus("in-progress")}
                  disabled={updating}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-card bg-spotify-warning/15 text-spotify-warning hover:bg-spotify-warning/25 transition-colors disabled:opacity-50"
                >
                  <Clock size={11} />
                  In Progress
                </button>
                <button
                  onClick={() => updateStatus("completed")}
                  disabled={updating}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-card bg-spotify-green/15 text-spotify-green hover:bg-spotify-green/25 transition-colors disabled:opacity-50"
                >
                  <Check size={11} />
                  Mark Done
                </button>
              </>
            )}

            {status === "in-progress" && (
              <button
                onClick={() => updateStatus("completed")}
                disabled={updating}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-card bg-spotify-green/15 text-spotify-green hover:bg-spotify-green/25 transition-colors disabled:opacity-50"
              >
                <Check size={11} />
                Mark Done
              </button>
            )}

            {status === "completed" && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-card bg-spotify-green/15 text-spotify-green">
                <Check size={11} />
                Completed
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { StatusDot, getDueInfo, CATEGORY_COLORS, CATEGORY_LABELS };
