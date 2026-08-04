"use client";

import { useEffect, useState } from "react";
import {
  Palette,
  Layout,
  Component,
  RotateCcw,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Bookmark,
} from "lucide-react";

interface AppTheme {
  accentColor: string;
  cardBackground: string;
  cardBorder: string;
  sidebarBackground: string;
  pageBackground: string;
  primaryText: string;
  secondaryText: string;
  cardBorderRadius: number;
  cardSpacing: string;
  sidebarWidth: string;
  fontSize: string;
  badgeStyle: string;
  animationsEnabled: boolean;
  showUrgencyColors: boolean;
}

const DEFAULTS: AppTheme = {
  accentColor: "#1DB954",
  cardBackground: "#181818",
  cardBorder: "#282828",
  sidebarBackground: "#000000",
  pageBackground: "#121212",
  primaryText: "#FFFFFF",
  secondaryText: "#B3B3B3",
  cardBorderRadius: 8,
  cardSpacing: "comfortable",
  sidebarWidth: "default",
  fontSize: "medium",
  badgeStyle: "pill",
  animationsEnabled: true,
  showUrgencyColors: true,
};

const ACCENT_PRESETS = [
  { color: "#1DB954", name: "Spotify Green" },
  { color: "#00D4AA", name: "Teal" },
  { color: "#1E90FF", name: "Blue" },
  { color: "#8B5CF6", name: "Purple" },
  { color: "#F59E0B", name: "Orange" },
  { color: "#EC4899", name: "Pink" },
];

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 text-xs font-mono px-2 py-1 rounded border"
          style={{
            backgroundColor: "var(--card-border)",
            borderColor: "var(--card-border)",
            color: "var(--text-primary)",
          }}
        />
      </div>
    </div>
  );
}

function ToggleGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className="text-sm block mb-2" style={{ color: "var(--text-secondary)" }}>
        {label}
      </span>
      <div className="flex gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="px-3 py-1.5 text-xs rounded transition-colors"
            style={{
              backgroundColor:
                value === opt.value ? "var(--accent-color)" : "var(--card-border)",
              color: value === opt.value ? "#000" : "var(--text-secondary)",
              fontWeight: value === opt.value ? 600 : 400,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ThemeEditor() {
  const [theme, setTheme] = useState<AppTheme>(DEFAULTS);
  const [original, setOriginal] = useState<AppTheme>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewOnly, setPreviewOnly] = useState(false);

  useEffect(() => {
    fetch("/api/theme")
      .then((r) => r.json())
      .then((data) => {
        if (data.theme) {
          setTheme(data.theme);
          setOriginal(data.theme);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (previewOnly) {
      applyPreview(theme);
    }
  }, [theme, previewOnly]);

  function applyPreview(t: AppTheme) {
    const root = document.documentElement;
    root.style.setProperty("--accent-color", t.accentColor);
    root.style.setProperty("--card-bg", t.cardBackground);
    root.style.setProperty("--card-border", t.cardBorder);
    root.style.setProperty("--sidebar-bg", t.sidebarBackground);
    root.style.setProperty("--page-bg", t.pageBackground);
    root.style.setProperty("--text-primary", t.primaryText);
    root.style.setProperty("--text-secondary", t.secondaryText);
    root.style.setProperty("--card-radius", `${t.cardBorderRadius}px`);
    root.style.setProperty("--container-radius", `${t.cardBorderRadius + 4}px`);

    const fontScales: Record<string, string> = { small: "0.9", medium: "1", large: "1.1" };
    root.style.setProperty("--font-scale", fontScales[t.fontSize] ?? "1");

    const sidebarWidths: Record<string, string> = { narrow: "200px", default: "240px", wide: "280px" };
    root.style.setProperty("--sidebar-width", sidebarWidths[t.sidebarWidth] ?? "240px");

    const badgeRadii: Record<string, string> = { pill: "9999px", "rounded square": "6px", square: "2px" };
    root.style.setProperty("--badge-radius", badgeRadii[t.badgeStyle] ?? "9999px");
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/theme", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(theme),
    });
    if (res.ok) {
      const data = await res.json();
      setOriginal(data.theme);
      localStorage.setItem("csmart_theme", JSON.stringify(data.theme));
      applyPreview(data.theme);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  function handleReset() {
    setTheme(DEFAULTS);
    if (previewOnly) applyPreview(DEFAULTS);
  }

  function revertPreview() {
    applyPreview(original);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "var(--accent-color)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Editor (left 2 cols) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Colors */}
        <div className="rounded-lg p-5" style={{ backgroundColor: "var(--card-bg)", border: `1px solid var(--card-border)` }}>
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: "var(--text-primary)" }}>
            <Palette size={15} style={{ color: "var(--accent-color)" }} />
            Colors
          </h3>

          <div className="mb-4">
            <span className="text-xs block mb-2" style={{ color: "var(--text-secondary)" }}>
              Accent Presets
            </span>
            <div className="flex gap-2">
              {ACCENT_PRESETS.map((p) => (
                <button
                  key={p.color}
                  onClick={() => setTheme({ ...theme, accentColor: p.color })}
                  title={p.name}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: p.color,
                    outline: theme.accentColor === p.color ? "2px solid var(--text-primary)" : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <ColorPicker label="Accent" value={theme.accentColor} onChange={(v) => setTheme({ ...theme, accentColor: v })} />
            <ColorPicker label="Card Background" value={theme.cardBackground} onChange={(v) => setTheme({ ...theme, cardBackground: v })} />
            <ColorPicker label="Card Border" value={theme.cardBorder} onChange={(v) => setTheme({ ...theme, cardBorder: v })} />
            <ColorPicker label="Sidebar" value={theme.sidebarBackground} onChange={(v) => setTheme({ ...theme, sidebarBackground: v })} />
            <ColorPicker label="Page Background" value={theme.pageBackground} onChange={(v) => setTheme({ ...theme, pageBackground: v })} />
            <ColorPicker label="Primary Text" value={theme.primaryText} onChange={(v) => setTheme({ ...theme, primaryText: v })} />
            <ColorPicker label="Secondary Text" value={theme.secondaryText} onChange={(v) => setTheme({ ...theme, secondaryText: v })} />
          </div>
        </div>

        {/* Layout */}
        <div className="rounded-lg p-5" style={{ backgroundColor: "var(--card-bg)", border: `1px solid var(--card-border)` }}>
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: "var(--text-primary)" }}>
            <Layout size={15} style={{ color: "var(--accent-color)" }} />
            Layout
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Card Border Radius
                </span>
                <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                  {theme.cardBorderRadius}px
                </span>
              </div>
              <input
                type="range"
                min={4}
                max={20}
                value={theme.cardBorderRadius}
                onChange={(e) => setTheme({ ...theme, cardBorderRadius: parseInt(e.target.value) })}
                className="w-full accent-[var(--accent-color)]"
              />
            </div>

            <ToggleGroup
              label="Card Spacing"
              options={[
                { value: "compact", label: "Compact" },
                { value: "comfortable", label: "Comfortable" },
                { value: "spacious", label: "Spacious" },
              ]}
              value={theme.cardSpacing}
              onChange={(v) => setTheme({ ...theme, cardSpacing: v })}
            />

            <ToggleGroup
              label="Sidebar Width"
              options={[
                { value: "narrow", label: "Narrow" },
                { value: "default", label: "Default" },
                { value: "wide", label: "Wide" },
              ]}
              value={theme.sidebarWidth}
              onChange={(v) => setTheme({ ...theme, sidebarWidth: v })}
            />

            <ToggleGroup
              label="Font Size"
              options={[
                { value: "small", label: "Small" },
                { value: "medium", label: "Medium" },
                { value: "large", label: "Large" },
              ]}
              value={theme.fontSize}
              onChange={(v) => setTheme({ ...theme, fontSize: v })}
            />
          </div>
        </div>

        {/* Components */}
        <div className="rounded-lg p-5" style={{ backgroundColor: "var(--card-bg)", border: `1px solid var(--card-border)` }}>
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: "var(--text-primary)" }}>
            <Component size={15} style={{ color: "var(--accent-color)" }} />
            Components
          </h3>

          <div className="space-y-4">
            <ToggleGroup
              label="Badge Style"
              options={[
                { value: "pill", label: "Pill" },
                { value: "rounded square", label: "Rounded" },
                { value: "square", label: "Square" },
              ]}
              value={theme.badgeStyle}
              onChange={(v) => setTheme({ ...theme, badgeStyle: v })}
            />

            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Animations</span>
              <button
                onClick={() => setTheme({ ...theme, animationsEnabled: !theme.animationsEnabled })}
                className="w-10 h-5 rounded-full transition-colors relative"
                style={{ backgroundColor: theme.animationsEnabled ? "var(--accent-color)" : "var(--card-border)" }}
              >
                <div
                  className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all"
                  style={{ left: theme.animationsEnabled ? "22px" : "2px" }}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Urgency Colors</span>
              <button
                onClick={() => setTheme({ ...theme, showUrgencyColors: !theme.showUrgencyColors })}
                className="w-10 h-5 rounded-full transition-colors relative"
                style={{ backgroundColor: theme.showUrgencyColors ? "var(--accent-color)" : "var(--card-border)" }}
              >
                <div
                  className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all"
                  style={{ left: theme.showUrgencyColors ? "22px" : "2px" }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: "var(--accent-color)", color: "#000" }}
          >
            {saved ? <><Check size={14} /> Applied!</> : saving ? "Applying..." : "Apply to All Users"}
          </button>

          <button
            onClick={handleReset}
            className="px-4 py-2.5 text-sm rounded-lg transition-colors flex items-center gap-2"
            style={{ backgroundColor: "var(--card-border)", color: "var(--text-secondary)" }}
          >
            <RotateCcw size={14} /> Reset to Spotify Defaults
          </button>

          <button
            onClick={() => {
              setPreviewOnly(!previewOnly);
              if (previewOnly) revertPreview();
            }}
            className="px-4 py-2.5 text-sm rounded-lg transition-colors flex items-center gap-2"
            style={{ backgroundColor: "var(--card-border)", color: "var(--text-secondary)" }}
          >
            {previewOnly ? <><EyeOff size={14} /> Stop Preview</> : <><Eye size={14} /> Preview Only</>}
          </button>
        </div>
      </div>

      {/* Live Preview (right col) */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Live Preview
        </h3>

        {/* Sample sidebar */}
        <div
          className="rounded-lg p-3 space-y-1.5"
          style={{
            backgroundColor: theme.sidebarBackground,
            borderRadius: `${theme.cardBorderRadius}px`,
          }}
        >
          <div className="h-1 rounded-full" style={{ background: `linear-gradient(to right, ${theme.accentColor}cc, ${theme.accentColor}33)` }} />
          <p className="text-xs font-bold px-2 pt-2" style={{ color: theme.primaryText }}>CSMart</p>
          {["Dashboard", "Timeline", "Digest"].map((item, i) => (
            <div
              key={item}
              className="flex items-center gap-2 px-2 py-1.5"
              style={{
                backgroundColor: i === 0 ? theme.cardBackground : "transparent",
                color: i === 0 ? theme.accentColor : theme.secondaryText,
                borderRadius: `${theme.cardBorderRadius}px`,
                fontSize: "11px",
              }}
            >
              <div className="w-3 h-3 rounded" style={{ backgroundColor: i === 0 ? theme.accentColor : theme.cardBorder }} />
              {item}
            </div>
          ))}
        </div>

        {/* Sample card */}
        <div
          className="p-4 space-y-2"
          style={{
            backgroundColor: theme.cardBackground,
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: `${theme.cardBorderRadius}px`,
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full" style={{ backgroundColor: theme.cardBorder }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: theme.primaryText }}>Sarah M.</p>
              <p className="text-xs" style={{ color: theme.secondaryText }}>#americas-cs</p>
            </div>
          </div>
          <p className="text-xs" style={{ color: theme.secondaryText }}>
            Has anyone tried the new targeting feature?
          </p>
          <div className="flex items-center gap-2">
            <span
              className="text-xs px-2 py-0.5"
              style={{
                backgroundColor: `${theme.accentColor}20`,
                color: theme.accentColor,
                borderRadius: theme.badgeStyle === "pill" ? "9999px" : theme.badgeStyle === "rounded square" ? "6px" : "2px",
              }}
            >
              TECH1
            </span>
            <div className="flex gap-1 ml-auto">
              <ExternalLink size={11} style={{ color: theme.secondaryText }} />
              <Bookmark size={11} style={{ color: theme.secondaryText }} />
            </div>
          </div>
        </div>

        {/* Sample urgency badges */}
        <div
          className="p-4 space-y-2"
          style={{
            backgroundColor: theme.cardBackground,
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: `${theme.cardBorderRadius}px`,
          }}
        >
          <p className="text-xs font-semibold" style={{ color: theme.primaryText }}>Urgency Badges</p>
          <div className="flex gap-1.5 flex-wrap">
            {[
              { label: "Urgent", color: theme.showUrgencyColors ? "#E74C3C" : theme.secondaryText },
              { label: "High", color: theme.showUrgencyColors ? "#F39C12" : theme.secondaryText },
              { label: "Normal", color: theme.showUrgencyColors ? theme.accentColor : theme.secondaryText },
            ].map((b) => (
              <span
                key={b.label}
                className="text-xs px-2 py-0.5"
                style={{
                  backgroundColor: `${b.color}20`,
                  color: b.color,
                  borderRadius: theme.badgeStyle === "pill" ? "9999px" : theme.badgeStyle === "rounded square" ? "6px" : "2px",
                }}
              >
                {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Sample button */}
        <button
          className="w-full py-2 text-sm font-semibold"
          style={{
            backgroundColor: theme.accentColor,
            color: "#000",
            borderRadius: `${theme.cardBorderRadius}px`,
          }}
        >
          Sample Button
        </button>

        {/* Sample text */}
        <div
          className="p-4"
          style={{
            backgroundColor: theme.pageBackground,
            borderRadius: `${theme.cardBorderRadius}px`,
          }}
        >
          <p className="text-sm font-semibold" style={{ color: theme.primaryText }}>Primary Text</p>
          <p className="text-xs mt-1" style={{ color: theme.secondaryText }}>
            Secondary text appears like this throughout the app.
          </p>
        </div>
      </div>
    </div>
  );
}
